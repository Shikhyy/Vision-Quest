import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { ZONES } from '../assets/zones';

export default function PlayerProfile() {
    const navigateTo = useGameStore((s) => s.navigateTo);
    const {
        name, level, xp, xpToNext, title,
        zonesCompleted, badges, inventory,
        emotionStats,
    } = usePlayerStore();

    const xpProgress = xpToNext > 0 ? Math.max(0, 1 - xpToNext / (xp + xpToNext)) * 100 : 100;

    // Most detected emotion
    const topEmotion = Object.entries(emotionStats).sort((a, b) => b[1] - a[1])[0];

    return (
        <div
            className="game-cursor"
            style={{
                width: '100%',
                height: '100vh',
                background: 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'auto',
                padding: '32px 24px',
                position: 'relative',
            }}
        >
            {/* Background */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: `
                        radial-gradient(ellipse at 50% 20%, #7B2FBE0C, transparent 55%),
                        radial-gradient(ellipse at 80% 80%, #00D4FF06, transparent 50%)
                    `,
                    pointerEvents: 'none',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    maxWidth: 600,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    zIndex: 1,
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2
                        style={{
                            fontFamily: 'var(--font-game)',
                            fontSize: 14,
                            color: 'var(--purple)',
                        }}
                        className="text-glow-purple"
                    >
                        PLAYER PROFILE
                    </h2>
                    <motion.button
                        onClick={() => navigateTo('village-map')}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            color: 'var(--gray)',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--dark-gray)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            backdropFilter: 'blur(4px)',
                            transition: 'color 0.2s ease',
                        }}
                    >
                        ← Back
                    </motion.button>
                </div>

                {/* Player Card */}
                <div
                    style={{
                        background: 'var(--bg-glass)',
                        border: '2px solid var(--purple)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--glow-purple)',
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontFamily: 'var(--font-game)', fontSize: 16, color: 'var(--gold)' }}>
                                {name}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                                {title} • Level {level}
                            </div>
                        </div>
                        <div
                            style={{
                                fontFamily: 'var(--font-game)',
                                fontSize: 24,
                                color: 'var(--cyan)',
                                textShadow: '0 0 10px #00D4FF66',
                            }}
                        >
                            Lv.{level}
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)' }}>XP</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)' }}>
                                {xp} / {xp + xpToNext}
                            </span>
                        </div>
                        <div className="progress-bar" style={{ height: 12 }}>
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${xpProgress}%`,
                                    background: 'linear-gradient(90deg, var(--cyan), var(--purple))',
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Zone Completion */}
                <div
                    style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--dark-gray)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 20,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <h3 style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: 'var(--white)', marginBottom: 16 }}>
                        QUEST LOG
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {ZONES.map((zone) => {
                            const completed = zonesCompleted.includes(zone.id);
                            return (
                                <div
                                    key={zone.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px 14px',
                                        background: completed ? `${zone.color}08` : 'var(--bg-secondary)',
                                        border: `1px solid ${completed ? zone.color + '33' : 'var(--dark-gray)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <span style={{ fontSize: 20 }}>{zone.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontFamily: 'var(--font-game)', fontSize: 8, color: completed ? zone.color : 'var(--gray)' }}>
                                            {zone.name}
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray)' }}>
                                            {zone.xpReward} XP • {'★'.repeat(zone.difficulty)}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 14, color: completed ? 'var(--green)' : 'var(--dark-gray)' }}>
                                        {completed ? '✓' : '○'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Badges */}
                <div
                    style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--dark-gray)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 20,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <h3 style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: 'var(--white)', marginBottom: 16 }}>
                        BADGES ({badges.length})
                    </h3>
                    {badges.length === 0 ? (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dark-gray)' }}>
                            No badges earned yet. Complete quests to earn badges!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {badges.map((badge) => (
                                <div key={badge.id} className="badge badge-rare" title={badge.description}>
                                    <span>{badge.emoji}</span>
                                    <span>{badge.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Inventory */}
                <div
                    style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--dark-gray)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 20,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <h3 style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: 'var(--white)', marginBottom: 16 }}>
                        INVENTORY ({inventory.length})
                    </h3>
                    {inventory.length === 0 ? (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dark-gray)' }}>
                            No items collected yet. Defeat NPCs to find rare loot!
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {inventory.map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 14px',
                                        background: 'var(--bg-secondary)',
                                        border: `1px solid ${item.rarity === 'legendary' ? 'var(--gold)' : item.rarity === 'rare' ? 'var(--cyan)' : 'var(--dark-gray)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 12,
                                    }}
                                    title={item.description}
                                >
                                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--white)' }}>{item.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div
                    style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--dark-gray)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 20,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <h3 style={{ fontFamily: 'var(--font-game)', fontSize: 10, color: 'var(--white)', marginBottom: 16 }}>
                        STATS
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12,
                        }}
                    >
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)' }}>
                            Zones Completed: <span style={{ color: 'var(--green)' }}>{zonesCompleted.length}/3</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)' }}>
                            Badges Earned: <span style={{ color: 'var(--gold)' }}>{badges.length}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)' }}>
                            Items Found: <span style={{ color: 'var(--cyan)' }}>{inventory.length}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gray)' }}>
                            Most Emotion: <span style={{ color: 'var(--purple)' }}>{topEmotion ? topEmotion[0] : 'None'}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
