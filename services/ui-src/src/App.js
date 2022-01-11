import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Auth } from "aws-amplify";
import { AppContext } from "./libs/contextLib";
import { onError } from "./libs/errorLib";
import { loginLocalUser, currentUserInfo } from "./libs/user";
import Routes from "./Routes";
import Header from "./components/Header";
import Footer from "./components/Footer";
import config from "./config";

function App() {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const history = useHistory();

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      const localLogin = config.LOCAL_LOGIN === "true";
      if (localLogin) {
        const isUserLoggedIn = await currentUserInfo();
        if (isUserLoggedIn.username) {
          userHasAuthenticated(true);
        } else {
          setIsAuthenticating(false);
        }
      } else {
        await Auth.currentSession();
        userHasAuthenticated(true);
      }
    } catch (e) {
      if (e !== "No current user") {
        onError(e);
      }
    }
    setIsAuthenticating(false);
  }

  async function handleLogout() {
    await Auth.signOut();

    userHasAuthenticated(false);

    history.push("/");
  }

  async function handleLogin(event) {
    event.preventDefault();
    try {
      const localLogin = config.LOCAL_LOGIN === "true";
      if (localLogin) {
        const alice = {
          username: "alice",
          attributes: {
            given_name: "Alice",
            family_name: "Foo",
            email: "alice@example.com",
          },
        };
        loginLocalUser(alice);
        userHasAuthenticated(true);
      } else {
        const authConfig = Auth.configure();
        const { domain, redirectSignIn, responseType } = authConfig.oauth;
        const clientId = authConfig.userPoolWebClientId;
        const url = `https://${domain}/oauth2/authorize?redirect_uri=${redirectSignIn}&response_type=${responseType}&client_id=${clientId}`;
        window.location.assign(url);
      }
    } catch (e) {
      onError(e);
    }
  }

  return (
    !isAuthenticating && (
      <div id="app-wrapper">
        <Header
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
          handleLogin={handleLogin}
        />
        <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated }}>
          <Routes />
          <Footer />
        </AppContext.Provider>
      </div>
    )
  );
}

export default App;
