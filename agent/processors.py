import os
import asyncio
import io
import base64
from PIL import Image
from pydantic import BaseModel
from vision_agents.core.processors.base_processor import Processor

class EmotionProcessor(Processor):
    """
    Analyzes live video frames using Moondream VQA to detect the player's 
    facial expressions and injects the detection context into the LLM stream.
    """
    def __init__(self, fps: float = 1.0):
        self.fps = fps
        self.api_key = os.getenv("MOONDREAM_API_KEY")
        
        # Load Moondream client if API key is present
        self.client = None
        if self.api_key:
            try:
                import moondream as md
                self.client = md.vl(api_key=self.api_key)
            except ImportError:
                print("⚠️  moondream package not found. Run: uv add moondream")

    async def process_video(self, track, participant_id, shared_forwarder):
        """Processes incoming video frames from the player."""
        # Process 1 frame per N seconds
        interval = 1.0 / self.fps
        last_process_time = 0

        # We will iterate over the video frames
        async for av_frame in track:
            current_time = asyncio.get_event_loop().time()
            if current_time - last_process_time < interval:
                continue
                
            last_process_time = current_time
            
            # Convert WebRTC frame to JPEG
            try:
                # av_frame is usually a VideoFrame from aiortc/PyAV
                img = av_frame.to_image()
                
                # Analyze expression via Moondream
                emotion = await self._analyze_expression(img)
                
                if emotion and emotion != "neutral":
                    print(f"[{participant_id}] 🎭 Emotion Detected: {emotion}")
                    
                    # Inject the context into the LLM
                    # (This is the equivalent of inject_text_to_llm from the PRD)
                    if hasattr(shared_forwarder, "put_text"):
                        await shared_forwarder.put_text(f"[EMOTION: {emotion}]")
                    else:
                        # Fallback payload structure if put_text isn't direct
                        from vision_agents.core.llm.llm_types import LLMResponseEvent
                        # We just print it for now if the SDK version differs
                        print(f"⚠️ Context injection skipped: [EMOTION: {emotion}]")

            except Exception as e:
                print(f"Error in EmotionProcessor: {e}")


    async def _analyze_expression(self, img: Image.Image) -> str:
        """Runs Moondream VQA to classify facial expressions."""
        if not self.client:
            return "neutral"  # Fallback if no API key
            
        # Moondream query
        try:
            # We must run this synchronous HTTP call in a thread pool to avoid blocking the video loop
            prompt = (
                "Analyze the facial expression of the person in this image. "
                "Respond with EXACTLY ONE of these words: happy, surprised, neutral, fearful, angry, disgusted, sad."
            )
            
            # encode image for moondream (vl client accepts encoded images or PIL image depending on SDK)
            # Typically moondream.vl accepts PIL Images directly in encode_image
            encoded_img = self.client.encode_image(img)
            
            # To run async
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                lambda: self.client.query(encoded_img, prompt)
            )
            
            answer = result["answer"].lower().strip()
            # Clean up punctuation
            answer = answer.strip(".,!?\"'")
            
            valid_emotions = ["happy", "surprised", "neutral", "fearful", "angry", "disgusted", "sad"]
            for emotion in valid_emotions:
                if emotion in answer:
                    return emotion
            
            return "neutral"
        except Exception as e:
            print(f"Moondream API Error: {e}")
            return "neutral"


class ObjectDetectionProcessor(Processor):
    """
    Analyzes live video frames using the Roboflow Inference API (COCO Dataset)
    to detect real-world objects the player is holding up to the camera,
    injecting the context into the LLM stream for The Sage's riddles.
    """
    def __init__(self, fps: float = 0.5):
        self.fps = fps
        self.api_key = os.getenv("ROBOFLOW_API_KEY")

    async def process_video(self, track, participant_id, shared_forwarder):
        """Processes incoming video frames from the player."""
        interval = 1.0 / self.fps
        last_process_time = 0

        async for av_frame in track:
            current_time = asyncio.get_event_loop().time()
            if current_time - last_process_time < interval:
                continue
                
            last_process_time = current_time
            
            try:
                img = av_frame.to_image()
                detected_objects = await self._detect_objects(img)
                
                if detected_objects:
                    # Just take the highest confidence object or top 3
                    top_objects = [obj['class'] for obj in detected_objects[:3]]
                    objects_str = ", ".join(top_objects)
                    print(f"[{participant_id}] 🔮 Objects Detected: {objects_str}")
                    
                    if hasattr(shared_forwarder, "put_text"):
                        await shared_forwarder.put_text(f"[DETECTED_OBJECTS: {objects_str}]")
                    else:
                        print(f"⚠️ Context injection skipped: [DETECTED_OBJECTS: {objects_str}]")

            except Exception as e:
                print(f"Error in ObjectDetectionProcessor: {e}")

    async def _detect_objects(self, img: Image.Image) -> list:
        if not self.api_key:
            return []
            
        try:
            import requests
            
            # Convert PIL image to base64
            buffered = io.BytesIO()
            # Compress slightly for speed
            img.convert('RGB').save(buffered, format="JPEG", quality=80)
            img_str = base64.b64encode(buffered.getvalue()).decode("ascii")
            
            # Use Roboflow's hosted COCO model (80 common objects) 
            upload_url = f"https://detect.roboflow.com/coco/3?api_key={self.api_key}"
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: requests.post(
                    upload_url,
                    data=img_str,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
            )
            
            if response.status_code == 200:
                data = response.json()
                # Return predictions sorted by confidence
                predictions = data.get("predictions", [])
                predictions.sort(key=lambda x: x.get("confidence", 0), reverse=True)
                return predictions
            else:
                print(f"Roboflow API returned {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            print(f"Roboflow detection error: {e}")
            return []

