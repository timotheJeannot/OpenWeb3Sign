import './App.css';

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import { Suspense, useEffect, useState } from 'react';

import { io } from "socket.io-client";
import { SocketContext } from './context/socket';

import Loading from './components/loading/Loading';
import Home from './components/home/Home';
import NavigationBar from './components/navigationbar/NavigationBar';
import SignUp from './components/signup/SignUp';
import ErrorRoute from './components/errorRoute/ErrorRoute';
import Camera from './components/camera/Camera';
import SignIn from './components/signin/Signin';
import Profile from './components/profile/Profile';
import { UserContext } from './context/user';
import SignDocument from './components/signDocument/SignDocument';
import CreateSignature from './components/createSignature/CreateSignature';

function App() {

  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {

    const user = JSON.parse(localStorage.getItem("user"));

    let newSocket = null;

    if (user?.accessToken) {
      newSocket = io({
        query: {
          token: user.accessToken
        }
      });
    }
    else {
      newSocket = io();
    }

    newSocket.on("connect", () => {
      console.log(newSocket.id);
      if (user?.accessToken && user?.id) {
        newSocket.userId = user.id;
        setCurrentUser(user);
      }
      setSocket(newSocket);
    });

    newSocket.on("disconnect", () => {
      console.log("socket disconnected");
      setSocket(null);
      setCurrentUser(null);
    });

    newSocket.on("connect_error", err => {
      //https://socket.io/fr/docs/v4/server-api/#namespaceusefn
      console.log(err.message);
      console.log(err.data);
      setSocket(null);
      setCurrentUser(null);
    });

    return () => {
      newSocket.disconnect();
    }

  }, []);

  return <Suspense
    fallback={
      <Loading />
    }
  >
    <SocketContext.Provider value={socket}>
      <UserContext.Provider value={currentUser}>
        <NavigationBar />
        <Router>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/sign_up' element={<SignUp />} />
            <Route path="/sign_in" element={<SignIn />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/sign_document" element={<SignDocument />}/>
            <Route path="/create_signature" element={<CreateSignature />}/>
            <Route path="/camera/:socketIdOrignalDevice/:firstDigit/:secondDigit/:thirdDigit/:fourthDigit" element={<Camera time={14} />} />
            <Route path="*" element={<ErrorRoute />} />
          </Routes>
        </Router>
      </UserContext.Provider>
    </SocketContext.Provider>
  </Suspense>

}

export default App;
