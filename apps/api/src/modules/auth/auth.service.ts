import ApiError from "../../utils/ApiError";
import bcrypt from "bcrypt";
import { createUser, findUserByEmail, findUserByUsername } from "./auth.repository";

export const registerService = async (data: {
  username: string;
  displayName: string;
  email: string;
  password: string;
}) => {
  const { username, displayName, email, password } = data;
  const usernameExists = await findUserByUsername(username);
  if (usernameExists) {
    throw new ApiError(409, "Username is not available");
  }
  const emailExists = await findUserByEmail(email);
  if (emailExists) {
    throw new ApiError(409, "User with this email already exist");
  }
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return await createUser({ username, displayName, email, hashedPassword });
};
