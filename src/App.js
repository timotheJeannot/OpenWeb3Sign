import logo from './logo.svg';
import './App.css';

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { Suspense, useEffect, useState } from 'react';
import Loading from './components/loading/Loading';
import Home from './components/home/Home';
import NavigationBar from './components/navigationbar/NavigationBar';
import SignUp from './components/signup/SignUp';

import { io } from "socket.io-client";
import { SocketContext } from './context/socket';
import ErrorRoute from './components/errorRoute/ErrorRoute';
import Camera from './components/camera/Camera';

function App() {

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let newSocket = io();

    newSocket.on("connect", () => {
      console.log(newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on("disconnect", () => {
      console.log("socket disconnected");
    });

    newSocket.on("connect_error", err => {
      //https://socket.io/fr/docs/v4/server-api/#namespaceusefn
      console.log(err.message);
      console.log(err.data);
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
      <NavigationBar />
      <Router>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/sign_up' element={<SignUp />} />
          <Route path="/camera/:socketIdOrignalDevice/:firstDigit/:secondDigit/:thirdDigit/:fourthDigit" element={<Camera time={14} />} />
          <Route path="*" element={<ErrorRoute />} />
        </Routes>
      </Router>
    </SocketContext.Provider>
  </Suspense>

}

export default App;
