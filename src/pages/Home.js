import React from 'react';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            <header className="home-header">
                <h1>Welcome to Imbass</h1>
                <p>A next-generation platform featuring modern design aesthetics, smooth gradients, and premium responsive layouts.</p>
                <button className="primary-btn">Get Started</button>
            </header>

            <section className="dashboard-cards">
                <div className="card">
                    <div className="card-icon">🚀</div>
                    <h3>Performance</h3>
                    <p>Lightning fast rendering and optimized data flow crafted with modern React practices.</p>
                </div>
                <div className="card">
                    <div className="card-icon">💎</div>
                    <h3>Aesthetics</h3>
                    <p>Premium dark mode with smooth purple, teal, and silver gradients providing a stunning visual experience.</p>
                </div>
                <div className="card">
                    <div className="card-icon">⚡</div>
                    <h3>Responsive</h3>
                    <p>Flawless native-like experience running smoothly on desktop, tablet, and mobile devices.</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
