import jwt from "jsonwebtoken";

export const login = (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminUsername || !adminPassword || !jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Server auth configuration is missing",
      });
    }

    const isValidAdmin = username === adminUsername && password === adminPassword;

    if (!isValidAdmin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        username: adminUsername,
        role: "admin",
      },
      jwtSecret,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};