const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const main_path = path.join(__dirname, "userData.db");
console.log(main_path);

let user_db = null;
const connect_user_database = async () => {
  try {
    user_db = await open({
      filename: main_path,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at 3000");
    });
  } catch (e) {
    console.log(`error ${e.message}`);
    process.exit(1);
  }
};

connect_user_database();

//1==>If the username already exists/--->registration
app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  const length_pass = password.length;
  const hashed_pass = await bcrypt.hash(password, 10);
  console.log(hashed_pass);
  const chech_person_query = `
  SELECT
  *
  FROM
  user
  WHERE
  username="${username}";
  `;
  const check_user = await user_db.get(chech_person_query);
  if (check_user !== undefined) {
    response.status = 400;
    response.send("User already exists");
  } else if (check_user === undefined && length_pass < 5) {
    response.status = 400;
    response.send("Password is too short");
  } else if (check_user === undefined && length_pass >= 5) {
    const add_user = `
      INSERT INTO 
      user
      (username,name,password,gender,location)
      VALUES
      ("${username}","${name}","${hashed_pass}","${gender}","${location}");
      `;
    const adding_user = await user_db.run(add_user);
    response.status = 200;
    response.send("User created successfully");
  }
});
//2-->login logoff
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const find_user_query = `
  SELECT
  *
  FROM
  user
  WHERE
  username="${username}";
  `;
  const find_user = await user_db.get(find_user_query);
  console.log(find_user);
  if (find_user === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const compare_pass = await bcrypt.compare(password, find_user.password);
    console.log(compare_pass);
    if (compare_pass === true) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

//3--->update
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const get_person_query = `
  SELECT
  *
  FROM
  user
  WHERE
  username="${username}"
  ;`;
  const get_person = await user_db.get(get_person_query);
  console.log(get_person);
  const compare_pass = await bcrypt.compare(oldPassword, get_person.password);
  console.log(compare_pass);
  if (compare_pass === true) {
    //updatepassword
    if (newPassword.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const new_hashed_pass = await bcrypt.hash(newPassword, 10);
      const updatepass_query = `
      update user
      SET 
      password="${new_hashed_pass}"
      WHERE
      username="${username}"
      ;`;
      const updatepass = user_db.run("query");
      response.status = 200;
      response.send("Password updated");
    }
  } else {
    response.status = 400;
    response.send("Invalid current password");
  }
});
module.exports = app;
