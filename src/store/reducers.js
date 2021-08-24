import { combineReducers } from "redux";

// App
import App from "./app/reducer";
// Front
import Layout from "./layout/reducer";

// Authentication
import Login from "./auth/login/reducer";
import Account from "./auth/register/reducer";
import ForgetPassword from "./auth/forgetpwd/reducer";

const rootReducer = combineReducers({
  App,
  Layout,
  Login,
  Account,
  ForgetPassword
});

export default rootReducer;
