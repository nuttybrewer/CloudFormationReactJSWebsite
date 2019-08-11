/* eslint-disable no-console */
import React, {Component} from 'react';
import { instanceOf } from 'prop-types';
import { BrowserRouter, Route, Redirect, Link } from 'react-router-dom'; // eslint-disable-line
import { withCookies, Cookies } from 'react-cookie';
import jsonwebtoken from 'jsonwebtoken';

import { Container, Navbar, Nav} from 'react-bootstrap';

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
        console.log("Setting new sessiontoken");
        try {
          cookies.set('sessiontoken', sessiontoken, { domain: domain, secure: secure, path: '/', expires: new Date(token.payload.exp * 1000)});
        }
        catch(err) {
          console.log("Error setting cookie " + err.message);
        }
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
//  <p>
//   <Link to="/">Home</Link>
//   &nbsp;|&nbsp;
//   <Link to="/github">Github</Link>
// </p>

  render() {
    const { sessiontoken, githubtoken } = this.state;
    return (
      <Container>
      { sessiontoken ?
      (
      <BrowserRouter>
        <div className="App">
          <header>
            <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
              <Navbar.Brand>Portal</Navbar.Brand>
              <Navbar.Toggle aria-controls="responsive-navbar-nav" />
              <Navbar.Collapse id="responsive-navbar-nav">
                <Nav fill variant="pills">
                  <Nav.Link as={Link} to="/">Home</Nav.Link>
                  <Nav.Link as={Link} to="/github">Field Extraction Editor</Nav.Link>
                </Nav>
              </Navbar.Collapse>
            </Navbar>
          </header>
          <main>
          <Container fluid="true">
            <Route
              exact
              path="/"
              render={(props) => <MainCard {...props} sessiontoken={sessiontoken} />}
            />
            <Route
              exact
              path="/github"
              render={(props) => <FieldExtractionPanel {...props} githubtoken={githubtoken} />}
            />
          </Container>
        </main>

        <footer class="footer mt-auto py-3">
          Footer
        </footer>
        </div>
      </BrowserRouter>
      )
      :
      (
        (<a href="/oauth/cognito/authorize">Please login to main app</a>)
      )
      }
    </Container>
    );
  }
}

export default withCookies(App);
