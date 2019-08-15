/* eslint-disable no-console */
import React, {Component} from 'react';
import { instanceOf } from 'prop-types';
import { BrowserRouter, Route, Redirect, Link } from 'react-router-dom'; // eslint-disable-line
import { withCookies, Cookies } from 'react-cookie';
import jsonwebtoken from 'jsonwebtoken';
import { Modal, Button } from 'react-bootstrap';

import { Navbar, Nav} from 'react-bootstrap';

import { FaSignOutAlt } from 'react-icons/fa';
// import logo from './logo.svg';
import './App.css';
import url from 'url';

import MainCard from './components/MainCard';
// import GithubPanel from './components/GithubPanel';
import FieldExtractionPanel from './components/FieldExtractionPanel';

class App extends Component{
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired
  };
  constructor(props) {
    super(props);
    this.signOut = this.signOut.bind(this);

    // Hold our state prior to assigning it.
    var state = {};

    // All this could be done in the constructor since this runs after everything is rendered.
    const { cookies } = this.props;
    const parsed_href = url.parse(window.location.href, true);
    // Handle the session token
    if (parsed_href.query.sessiontoken) {
      var sessiontoken;
      const token = jsonwebtoken.decode(parsed_href.query.sessiontoken, {complete: true});
      if (token && token.payload && token.payload.exp > Math.floor(Date.now()/1000)) {
        sessiontoken = parsed_href.query.sessiontoken;
        const domain = parsed_href.hostname.substring(parsed_href.hostname.indexOf('.') + 1, parsed_href.hostname.length);

        // This piece is for the mock up server that runs HTTP only.
        // COULD HAVE ILL-EFFECT if you don't deploy this site in https
        var secure = true
        console.log(parsed_href.protocol);
        if(parsed_href.protocol === 'http:') {
          console.log("http detected")
          secure = false;
        }
        cookies.set('sessiontoken', sessiontoken, { domain: domain, secure: secure, path: '/', expires: new Date(token.payload.exp * 1000)});
        // Clear the address bar
        window.history.replaceState(null, null, window.location.pathname);
      }
    }

    const cookieToken = cookies.get("sessiontoken");
    if (cookieToken){
      const token = jsonwebtoken.decode(cookieToken, {complete:true});
      if (token && token.payload && token.payload.exp > Math.floor(Date.now()/1000)) {
        console.log("Retrieving the sessiontoken from cookies");
        state.sessiontoken = cookieToken;
      }
      else {
        console.log("Session token expired, removing sessiontoken");
        cookies.remove("sessiontoken");
      }
    }


    // Handle the Gitub token
    if (parsed_href.query.githubtoken) {
      state.githubtoken = parsed_href.query.githubtoken;
      window.sessionStorage.setItem('githubtoken', parsed_href.query.githubtoken);
      // Clear the address bar
      window.history.replaceState(null, null, window.location.pathname);
    }
    else if (sessionStorage.getItem("githubtoken")) {
      state.githubtoken = sessionStorage.getItem("githubtoken");
    }

    this.state = state;
  }

  signOut() {
    const { cookies } = this.props;
    cookies.remove("sessiontoken");
    sessionStorage.clear();
    this.setState({githubtoken: null, sessiontoken: null})
  }
//  <p>
//   <Link to="/">Home</Link>
//   &nbsp;|&nbsp;
//   <Link to="/github">Github</Link>
// </p>

  render() {
    const { sessiontoken, githubtoken } = this.state;
    return (
      <div>
        { sessiontoken ?
        (
          <BrowserRouter>
            <div>
                <Navbar expand="lg" bg="dark" variant="dark">
                  <Navbar.Brand>Portal</Navbar.Brand>
                  <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                  <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="mr-auto">
                      <Nav.Link as={Link} to="/">Home</Nav.Link>
                      <Nav.Link as={Link} to="/github">Field Extraction Editor</Nav.Link>
                    </Nav>
                  </Navbar.Collapse>
                  <Button type="submit" variant="secondary" size="sm" onClick={this.signOut}>Sign Out <FaSignOutAlt/></Button>
                </Navbar>
                <Route
                  exact
                  path="/"
                  render={(props) => <MainCard {...props}  />}
                />
                <Route
                  exact
                  path="/github"
                  render={(props) => <FieldExtractionPanel {...props} githubtoken={githubtoken} />}
                />
            </div>
          </BrowserRouter>
        )
        :
        (
          <Modal show="true" >
            <Modal.Header >
              <Modal.Title>Portal App</Modal.Title>
            </Modal.Header>
              <Modal.Body>
                <h3 className="loginPrompt">This App Requires an account</h3>
              </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" href="/oauth/cognito/authorize">
                Login
              </Button>
            </Modal.Footer>
          </Modal>
        )
        }
      </div>
    );
  }
}

export default withCookies(App);
