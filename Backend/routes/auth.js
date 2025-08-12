const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
}

router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPw = await bcrypt.hash(password, 10);

    try {
        let user;
        if (role === "customer") {
            const {
                firstName, lastName, customerPhone, customerCountry,
                nic, birthDay, address
            } = req.body;

            if (!firstName || !lastName || !customerPhone || !customerCountry || !nic || !birthDay || !address) {
                return res.status(400).json({ message: "Missing customer fields" });
            }

            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPw,
                    role,
                    customerProfile: {
                        create: {
                            firstName,
                            lastName,
                            phone: customerPhone,
                            country: customerCountry,
                            nic,
                            birthDay: new Date(birthDay),
                            address,
                        }
                    }
                },
                include: { customerProfile: true }
            });

        } else if (role === "travel-company") {
            const {
                companyName, companyRegNo, companyPhone, companyCountry, companyAddress
            } = req.body;

            if (!companyName || !companyRegNo || !companyPhone || !companyCountry || !companyAddress) {
                return res.status(400).json({ message: "Missing company fields" });
            }

            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPw,
                    role,
                    travelCompanyProfile: {
                        create: {
                            companyName,
                            companyRegNo,
                            phone: companyPhone,
                            country: companyCountry,
                            address: companyAddress,
                        }
                    }
                },
                include: { travelCompanyProfile: true }
            });

        } else {
            return res.status(400).json({ message: "Invalid role" });
        }

        // Include the profile in the response for immediate frontend use
        res.status(201).json({
            message: "Registered successfully",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                customerProfile: user.customerProfile || undefined,
                travelCompanyProfile: user.travelCompanyProfile || undefined,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
});

// LOGIN ENDPOINT
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Missing fields" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                customerProfile: true,
                travelCompanyProfile: true,
            }
        });

        if (!user || user.role !== role) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Add customerProfileId to JWT if available
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        if (user.customerProfile) {
            tokenPayload.customerProfileId = user.customerProfile.id;
        }

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                customerProfile: user.customerProfile || undefined,
                travelCompanyProfile: user.travelCompanyProfile || undefined,
            },
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Login failed", error: err.message });
    }
});

// GET CURRENT USER ENDPOINT
router.get('/me', authenticateToken, async (req, res) => {
    console.log("[/api/me] req.user", req.user);
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                customerProfile: true,
                travelCompanyProfile: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                customerProfile: user.customerProfile || undefined,
                travelCompanyProfile: user.travelCompanyProfile || undefined,
            }
        });
    } catch (err) {
        console.error("[/api/me] error", err);
        res.status(500).json({ message: "Could not fetch user", error: err.message });
    }
});
module.exports = router;