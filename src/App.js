import logo from './logo.svg';
import './App.css';

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { Suspense } from 'react';
import Loading from './components/loading/Loading';
import Home from './components/home/Home';
import NavigationBar from './components/navigationbar/NavigationBar';
import SignUp from './components/signup/SignUp';

function App() {

  return <Suspense
    fallback={
      <Loading />
    }
  >
    <NavigationBar />
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/sign_up' element={<SignUp />}/>
      </Routes>
    </Router>
  </Suspense>

}

export default App;
