const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}


// =============================
// SIGN UP
// =============================

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required.",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        error: "Name must be at least 2 characters.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with that email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = createToken(user);

    return res.status(201).json({
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      error: "Unable to create account.",
    });
  }
});


// =============================
// LOGIN
// =============================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      let typoHint = "";
      if (/@(gamil|gmal|gmial|gmaill|gmai)\.com$/.test(normalizedEmail)) {
        const corrected = normalizedEmail.replace(/@(gamil|gmal|gmial|gmaill|gmai)\.com$/, "@gmail.com");
        const altUser = await User.findOne({ email: corrected });
        if (altUser) {
          typoHint = ` Did you mean ${corrected}?`;
        }
      }
      return res.status(401).json({
        error: `Invalid email or password.${typoHint}`,
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const token = createToken(user);

    return res.json({
      user: publicUser(user),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Unable to sign in.",
    });
  }
});


// =============================
// CURRENT USER
// =============================

router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: publicUser(req.user),
  });
});


// =============================
// LOGOUT
// =============================

router.post("/logout", requireAuth, async (_req, res) => {
  res.json({
    success: true,
    message: "Signed out successfully.",
  });
});


module.exports = router;