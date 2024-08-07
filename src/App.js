import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyABFqZ33WJQ25lGqceuk1kLxqkifyRA2BQ",
  authDomain: "supechat-9b602.firebaseapp.com",
  projectId: "supechat-9b602",
  storageBucket: "supechat-9b602.appspot.com",
  messagingSenderId: "982067072850",
  appId: "1:982067072850:web:473f892a55a5f71ed8348b",
  measurementId: "G-WT4CXKK8XL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const analytics = getAnalytics(app);

function App() {
  const [user] = useAuthState(auth);
  const [langPref, setLangPref] = useState('English')

  return (
    <div className="App">
      <header>
        <h1>⚛️🔥💬</h1>
        <Dropdown setLangPref={setLangPref}/>
        <SignOut />
      </header>

      <section>
        {user ? <ChatRoom langPref={langPref}/> : <SignIn />}
      </section>
    </div>
  );
}

const Dropdown = ({setLangPref}) => {

  const [open, setOpen] = useState(false);

  return (
      <div className='flex flex-col items-center'>
          <button onClick={() => setOpen(!open)} 
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              type="button">Languages <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 10 6">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4" />
              </svg>
          </button>


          {open && <div id="dropdown" className="z-10 top-16 absolute bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
              <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
                  <li>
                      <a 
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" onClick={()=>setLangPref('English')}>English</a>
                  </li>
                  <li>
                      <a 
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white" onClick={()=>setLangPref('Urdu')}>Urdu</a>
                  </li>

              </ul>
          </div>}
      </div>
    )
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <p>Do not violate the community guidelines or you will be banned for life!</p>
    </>
  );
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => signOut(auth)}>Sign Out</button>
  );
}

function ChatRoom({ langPref }) {
  const dummy = useRef();
  const messagesRef = collection(firestore, 'messages');
  const q = query(messagesRef, orderBy('createdAt'), limit(25));

  const [messages] = useCollectionData(q, { idField: 'id' });
  const [translatedMessages, setTranslatedMessages] = useState([]);

  useEffect(() => {
    const translateMessages = async () => {
      if (messages) {
        const translated = await Promise.all(messages.map(async (msg) => {
          const sourceLang = 'en';
          const targetLang = langPref.toLowerCase() === 'english' ? 'en' : 'ur';
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(msg.text)}`;

          try {
            const response = await fetch(url);
            const data = await response.json();
            return { ...msg, text: data[0][0][0] };
          } catch (error) {
            console.error('Error translating message:', error);
            return msg;
          }
        }));
        setTranslatedMessages(translated);
      }
    };

    translateMessages();
  }, [messages, langPref]);

  const [formValue, setFormValue] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL
    });

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <main>
        {translatedMessages && translatedMessages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="say something nice" />
        <button type="submit" disabled={!formValue}>🕊️</button>
      </form>
    </>
  );
}


function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
      <p>{text}</p>
    </div>
  );
}

export default App;
