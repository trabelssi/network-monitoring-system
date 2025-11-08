import { Head, Link } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Bienvenue" />
            <div
                style={{
                    minHeight: '100vh',
                    width: '100vw',
                    background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/4411.jpg') center center / cover no-repeat fixed`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Animated background elements */}
                <div className="particles"></div>
                <div className="floating-shapes">
                    <div className="shape shape1"></div>
                    <div className="shape shape2"></div>
                    <div className="shape shape3"></div>
                </div>
                
                <div
                    className="container"
                    style={{
                        maxWidth: 900,
                        padding: '60px 40px',
                        background: 'rgba(13, 71, 161, 0.2)',
                        borderRadius: 20,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        animation: 'fadeInBlur 1.5s ease-in-out',
                        color: 'white',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <div className="content-wrapper" style={{ position: 'relative' }}>
                        <div className="title-decoration"></div>
                        <img 
                            src="/logo-sancella.png" 
                            alt="Sancella Logo" 
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                marginBottom: '30px',
                                animation: 'fadeInBlur 1.5s ease-in-out',
                            }}
                        />
                        <h1 
                            style={{ 
                                fontSize: 42, 
                                fontWeight: 800, 
                                marginBottom: 24,
                                background: 'linear-gradient(45deg, #2196F3, #64B5F6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                animation: 'gradientShift 3s ease infinite',
                                position: 'relative',
                            }}
                        >
                            GLPI: La Puissance du Contrôle Qualité chez Sancella
                        </h1>
                        <p 
                            style={{ 
                                fontSize: 22, 
                                lineHeight: 1.6, 
                                marginBottom: 40,
                                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                position: 'relative',
                            }}
                        >
                            Réactivité, efficacité et traçabilité pour gérer efficacement les données de test avec GLPI. 
                            Graphiques, sécurité et collaboration pour un meilleur contrôle qualité chez Sancella.
                        </p>
                        <div style={{ display: 'flex', gap: 20 }}>
                            <Link 
                                href={route('login')} 
                                className="btn btn-login"
                                style={{
                                    padding: '12px 32px',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    color: '#1565C0',
                                    fontWeight: 600,
                                    borderRadius: 12,
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                                }}
                            >
                                Connexion
                            </Link>
                            <Link 
                                href={route('register')} 
                                className="btn btn-register"
                                style={{
                                    padding: '12px 32px',
                                    background: 'linear-gradient(45deg, #1565C0, #2196F3)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    borderRadius: 12,
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(33,150,243,0.3)',
                                    textDecoration: 'none',
                                    display: 'inline-block',
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(33,150,243,0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(33,150,243,0.3)';
                                }}
                            >
                                S'inscrire
                            </Link>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes fadeInBlur {
                        0% { opacity: 0; transform: translateY(20px); filter: blur(8px); }
                        100% { opacity: 1; transform: translateY(0); filter: blur(0); }
                    }

                    @keyframes gradientShift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }

                    .particles {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: radial-gradient(circle at center, transparent 0%, rgba(33,150,243,0.1) 100%);
                        animation: particleFloat 20s ease-in-out infinite;
                    }

                    .floating-shapes {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                    }

                    .shape {
                        position: absolute;
                        background: rgba(33,150,243,0.1);
                        border-radius: 50%;
                        animation: float 15s infinite;
                    }

                    .shape1 {
                        width: 300px;
                        height: 300px;
                        top: -150px;
                        right: -150px;
                        animation-delay: 0s;
                    }

                    .shape2 {
                        width: 200px;
                        height: 200px;
                        bottom: -100px;
                        left: -100px;
                        animation-delay: -5s;
                    }

                    .shape3 {
                        width: 150px;
                        height: 150px;
                        top: 50%;
                        right: 10%;
                        animation-delay: -10s;
                    }

                    @keyframes float {
                        0% { transform: translate(0, 0) rotate(0deg); }
                        50% { transform: translate(20px, 20px) rotate(180deg); }
                        100% { transform: translate(0, 0) rotate(360deg); }
                    }

                    @keyframes particleFloat {
                        0% { transform: translateY(0) scale(1); }
                        50% { transform: translateY(-20px) scale(1.1); }
                        100% { transform: translateY(0) scale(1); }
                    }

                    .title-decoration {
                        position: absolute;
                        top: -20px;
                        left: -20px;
                        width: 100px;
                        height: 100px;
                        border-top: 3px solid #2196F3;
                        border-left: 3px solid #2196F3;
                        opacity: 0.5;
                    }

                    .btn {
                        position: relative;
                        overflow: hidden;
                    }

                    .btn::after {
                        content: '';
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        width: 0;
                        height: 0;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50%;
                        transform: translate(-50%, -50%);
                        transition: width 0.6s ease, height 0.6s ease;
                    }

                    .btn:hover::after {
                        width: 300px;
                        height: 300px;
                    }

                    .container::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(45deg, rgba(33,150,243,0.1), transparent);
                        border-radius: 20px;
                        z-index: -1;
                    }
                `}</style>
            </div>
        </>
    );
}
