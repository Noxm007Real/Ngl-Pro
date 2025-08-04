import React, { useState, useEffect, useRef } from 'react';
import { Link, Send, Copy, AlertTriangle, Bug, Coffee, Sun, Moon } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import noteIconSvg from './assets/note-icon.svg?raw';
import './index.css';

const firebaseConfig = {
  apiKey: "AIzaSyA38SQnoQGgpIRPeDhmuR29Jju4vuKDVGI",
  authDomain: "ngl-pro-noxm007.firebaseapp.com",
  projectId: "ngl-pro-noxm007",
  storageBucket: "ngl-pro-noxm007.firebasestorage.app",
  messagingSenderId: "448368947926",
  appId: "1:448368947926:web:82b0aad4ed6765e8bf4f77",
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {
    const [nglUsername, setNglUsername] = useState('');
    const [messageText, setMessageText] = useState('');
    const [disguisedLink, setDisguisedLink] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [isMessageSent, setIsMessageSent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showWelcomePopup, setShowWelcomePopup] = useState(true);
    const [userCount, setUserCount] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const audioRef = useRef(null);

    useEffect(() => {
        let timer;
        if (timeLeft > 0) {
            timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else {
            setIsMessageSent(false);
        }
        return () => clearTimeout(timer);
    }, [timeLeft]);

    useEffect(() => {
        const counterRef = doc(db, 'stats', 'userCounter');
        const unsubscribe = onSnapshot(counterRef, (doc) => {
            if (doc.exists()) {
                setUserCount(doc.data().count);
            } else {
                setUserCount(0);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!showWelcomePopup && window.tsParticles) {
            const loadParticles = async () => {
                await window.tsParticles.load({
                    id: "tsparticles",
                    options: {
                        fullScreen: { enable: true, zIndex: -1 },
                        background: { color: { value: "transparent" } },
                        particles: {
                            color: { value: "#3b82f6" },
                            shape: {
                                type: "image",
                                image: {
                                    src: `data:image/svg+xml;base64,${btoa(noteIconSvg)}`,
                                },
                            },
                            size: { value: 20 },
                            number: { value: 50 },
                            links: { enable: false },
                            opacity: { value: 0.5 },
                            move: {
                                enable: true,
                                speed: 3,
                                direction: "top",
                                random: true,
                                straight: false,
                                outMode: "out",
                            },
                        },
                        interactivity: {
                            events: {
                                onHover: {
                                    enable: true,
                                    mode: "repulse",
                                },
                            },
                            modes: {
                                repulse: { distance: 100 },
                            },
                        },
                    },
                });
            };
            loadParticles();
        }
    }, [showWelcomePopup]);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleWelcomePopupClose = async () => {
        setShowWelcomePopup(false);
        setIsInitialLoad(false);
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Autoplay was prevented:", e));
        }

        const counterRef = doc(db, 'stats', 'userCounter');
        const counterDoc = await getDoc(counterRef);
        if (!counterDoc.exists()) {
            await setDoc(counterRef, { count: 0 });
        }
    };

    const handleCreateLink = async () => {
        if (!nglUsername.trim()) {
            setError('Nama pengguna NGL tidak boleh kosong!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/create-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nglUsername }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error dari server: ${errorText}`);
            }

            const data = await response.json();
            setDisguisedLink(`${window.location.origin}/?id=${data.disguisedId}`);
            setResponseMessage('Tautan berhasil dibuat!');
        } catch (err) {
            console.error('Gagal membuat tautan:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(disguisedLink)
            .then(() => alert('Tautan disalin ke clipboard!'))
            .catch(err => console.error('Gagal menyalin:', err));
    };

    const handleSendMessage = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const disguisedId = urlParams.get('id');

        if (!messageText.trim()) {
            setError('Pesan tidak boleh kosong!');
            return;
        }

        if (!disguisedId) {
            setError('Tautan samaran tidak valid.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ disguisedId, messageText }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal mengirim pesan.');
            }

            const data = await response.json();
            setResponseMessage(data.message);
            setMessageText('');
            setIsMessageSent(true);
            setTimeLeft(180);
        } catch (err) {
            console.error('Gagal mengirim pesan:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderLinkGenerator = () => (
        <div className={`min-h-screen p-4 flex flex-col items-center justify-center font-sans ${isDarkMode ? 'dark bg-gradient-to-br from-gray-800 via-gray-900 to-black text-gray-200' : 'bg-gradient-to-br from-pink-500 to-purple-600 text-white animate-background'} ${isInitialLoad ? '' : 'animate-fade-in'}`}>
            <div className={`w-full max-w-md mx-auto p-8 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-700/50 backdrop-filter backdrop-blur-md border border-gray-600' : 'bg-white/10 backdrop-filter backdrop-blur-md border border-white/20'}`}>
                <h1 className={`text-3xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-white'} ${isInitialLoad ? '' : 'animate-fade-in-up delay-100'}`}>Buat Tautan NGL Samaran</h1>
                <p className={`mb-6 text-center ${isInitialLoad ? '' : 'animate-fade-in-up delay-200'} ${isDarkMode ? 'text-gray-400' : 'text-gray-200'}`}>
                    Masukkan nama pengguna NGL Anda untuk membuat tautan yang akan menyembunyikan link asli Anda dari spam.
                </p>
                <div className={`relative mb-4 ${isInitialLoad ? '' : 'animate-fade-in-up delay-300'}`}>
                    <input
                        type="text"
                        value={nglUsername}
                        onChange={(e) => setNglUsername(e.target.value)}
                        placeholder="Nama pengguna NGL Anda"
                        className={`w-full p-3 pl-10 rounded-xl ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-500 border border-gray-600' : 'bg-gray-800 text-white placeholder-gray-400 border border-transparent'} focus:border-pink-500 focus:outline-none transition-colors`}
                    />
                    <Link size={20} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                {error && (
                    <div className={`flex items-center text-red-400 mb-4 bg-red-900/50 p-3 rounded-lg border border-red-800 ${isInitialLoad ? '' : 'animate-fade-in-up delay-400'}`}>
                        <AlertTriangle size={20} className="mr-2" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
                {responseMessage && (
                    <div className={`text-green-400 mb-4 text-center ${isInitialLoad ? '' : 'animate-fade-in-up delay-400'}`}>{responseMessage}</div>
                )}
                <button
                    onClick={handleCreateLink}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                    } ${isInitialLoad ? '' : 'animate-fade-in-up delay-500'}`}
                >
                    {loading ? 'Membuat...' : 'Buat Tautan Samaran'}
                </button>
                {disguisedLink && (
                    <div className={`mt-6 p-4 rounded-xl border flex items-center justify-between shadow-inner ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-800 border-gray-700'} ${isInitialLoad ? '' : 'animate-fade-in-up delay-600'}`}>
                        <span className={`truncate text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-300'}`}>{disguisedLink}</span>
                        <button
                            onClick={copyToClipboard}
                            className={`ml-4 p-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-white'}`}
                            title="Salin Tautan"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                )}
            </div>
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-200 ${isInitialLoad ? '' : 'animate-fade-in-up delay-700'} flex items-center justify-center space-x-1`}>
                <span>dibuat dengan</span> <span className="inline-block">🩷</span> <span>oleh</span> <a href="https://instagram.com/nelson.oxm007" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:underline">Noxm007</a>
            </div>
        </div>
    );

    const renderMessageForm = () => {
      const username = 'anonym';
      
      return (
        <div className={`min-h-screen p-4 flex flex-col items-center justify-center font-sans ${isDarkMode ? 'dark bg-gradient-to-br from-gray-800 to-black text-gray-200' : 'bg-gradient-to-br from-pink-500 to-purple-600 text-white animate-background'} ${isInitialLoad ? '' : 'animate-fade-in'}`}>
            <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-4 ${isInitialLoad ? '' : 'animate-fade-in-up delay-100'} ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/20 backdrop-blur-sm'}`}>
                <div className={`flex items-center space-x-2 mb-4 ${isInitialLoad ? '' : 'animate-fade-in-up delay-200'}`}>
                    <img
                        src="https://placehold.co/40x40/ffffff/000000?text=👤"
                        alt="Profile picture"
                        className="rounded-full w-10 h-10 bg-gray-300"
                    />
                    <div>
                        <div className="font-bold">@{username}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-200'}`}>kirimi aku pesan anonim!</div>
                    </div>
                </div>
                <div className={`relative mb-4 ${isInitialLoad ? '' : 'animate-fade-in-up delay-300'}`}>
                    <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="berapa tinggi kamu"
                        className={`w-full p-4 rounded-xl transition-all resize-none h-40 ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-gray-500' : 'bg-gradient-to-br from-purple-400 to-pink-500 text-white placeholder-white placeholder-opacity-70 focus:ring-2 focus:ring-pink-300'}`}
                    />
                    <div className={`absolute bottom-4 right-4 rounded-full p-1 cursor-pointer ${isInitialLoad ? '' : 'animate-fade-in-up delay-400'} ${isDarkMode ? 'bg-gray-500 bg-opacity-30' : 'bg-white bg-opacity-30'}`}>
                        <img src="https://placehold.co/20x20/000000/ffffff?text=👻" alt="Ghost icon" />
                    </div>
                </div>
            </div>

            <div className={`w-full max-w-sm my-4 ${isInitialLoad ? '' : 'animate-fade-in-up delay-400'}`}>
                {error && (
                    <div className="flex items-center text-red-400 mb-4 bg-red-900/50 p-3 rounded-lg border border-red-800">
                        <AlertTriangle size={20} className="mr-2" />
                        <span className="text-sm text-center">{error}</span>
                    </div>
                )}
                {responseMessage && (
                    <div className="text-green-400 mb-4 text-center">{responseMessage}</div>
                )}
                <button
                    onClick={handleSendMessage}
                    disabled={loading || isMessageSent}
                    className={`w-full py-4 px-4 rounded-full font-bold text-lg text-white bg-black hover:opacity-80 transition-all duration-300 transform shadow-lg ${
                        (loading || isMessageSent) ? 'opacity-50 cursor-not-allowed' : ''
                    } ${isInitialLoad ? '' : 'animate-fade-in-up delay-500'}`}
                >
                    {loading ? 'Mengirim...' : 'Kirim!'}
                </button>
            </div>

            {isMessageSent && (
                <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-200'} mt-4 ${isInitialLoad ? '' : 'animate-fade-in-up delay-500'}`}>
                    Anda dapat mengirim pesan lagi dalam {timeLeft} detik.
                </p>
            )}
            
            <div className={`w-full max-w-sm mt-8 text-center text-sm text-gray-200 ${isInitialLoad ? '' : 'animate-fade-in-up delay-600'}`}>
                <span className="block mb-2">
                  <img src="https://placehold.co/20x20/000000/ffffff?text=👇" alt="Down arrow" className="inline-block" />
                  {userCount} kawan baru je tekan butang
                  <img src="https://placehold.co/20x20/000000/ffffff?text=👇" alt="Down arrow" className="inline-block" />
                </span>
                <a href="/" className="block w-full py-4 px-4 rounded-full font-bold text-lg text-white bg-black hover:opacity-80 transition-all duration-300 transform shadow-lg">
                    Dapatkan pesan untukmu sendiri!
                </a>
            </div>
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-gray-200 ${isInitialLoad ? '' : 'animate-fade-in-up delay-700'} flex items-center justify-center space-x-1`}>
                <span>dibuat dengan</span> <span className="inline-block">🩷</span> <span>oleh</span> <a href="https://instagram.com/nelson.oxm007" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:underline">Noxm007</a>
            </div>
        </div>
      );
    };

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    return (
        <div className={`min-h-screen p-4 flex flex-col items-center justify-center font-sans ${isDarkMode ? 'dark' : ''}`}>
            {showWelcomePopup && (
                <div className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] animate-fade-in`}>
                    <div className={`bg-white p-8 rounded-xl max-w-sm mx-auto text-center shadow-2xl transition-all duration-500 transform scale-100 opacity-100 animate-fade-in-up`}>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Selamat Datang!</h2>
                        <p className="text-gray-600 mb-6">
                            Bersiaplah untuk pengalaman NGL.link tanpa spam! Kirim pesan anonim dengan tenang dan aman. Selamat menikmati!
                        </p>
                        <button
                            onClick={handleWelcomePopupClose}
                            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
                        >
                            Oke
                        </button>
                    </div>
                </div>
            )}
            <button onClick={toggleDarkMode} className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/20 text-white shadow-lg transition-transform hover:scale-110">
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            {userId ? renderMessageForm() : renderLinkGenerator()}
            <div className="fixed bottom-4 right-4 flex flex-col space-y-4">
                <a href="https://ko-fi.com/" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/20 rounded-full text-white shadow-lg transition-transform hover:scale-110">
                    <Coffee size={24} />
                </a>
                <a 
                    href="https://wa.me/6287838901041?text=web+Ngl+Pro+nya+bermasalah+bang" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-3 bg-white/20 rounded-full text-white shadow-lg transition-transform hover:scale-110">
                    <Bug size={24} />
                </a>
            </div>
            <audio ref={audioRef} src="https://files.catbox.moe/gj0me1.mp3" loop />
            <div id="tsparticles" className={`fixed inset-0 pointer-events-none z-10 ${showWelcomePopup ? 'hidden' : ''}`} />
        </div>
    );
};

export default App;
