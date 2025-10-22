const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Reservation controller
 * Exports:
 * - createReservation
 * - createResidentialReservation
 * - getReservations
 * - updateReservation
 * - deleteReservation
 * - getAllReservations (clerk)
 * - createClerkReservation
 * - checkinReservation
 * - checkoutReservation
 *
 * Routes should apply authenticateToken / authenticateClerkToken as appropriate.
 */

// --- Updated: createReservation to support multiple roomIds ---
async function createReservation(req, res) {
    const {
        hotelId,
        roomType,
        roomIds, // Array of room IDs to assign
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        skipCreditCard,
        fullName,
        email,
        phone,
        // durationType,       // REMOVE (not in schema)
        // durationCount,      // REMOVE (not in schema)
    } = req.body;
    const customerId = req.user && req.user.customerProfileId;

    if (!customerId) return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    if (!hotelId) return res.status(400).json({ error: "Hotel ID is required." });
    if (!roomType) return res.status(400).json({ error: "Room type is required." });
    if (!Array.isArray(roomIds) || roomIds.length === 0) {
        return res.status(400).json({ error: "At least one room must be selected." });
    }

    // Optional: validate hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: Number(hotelId) } });
    if (!hotel) return res.status(404).json({ error: "Hotel not found." });

    try {
        let paymentIntent = null;
        let status = "pending";
        let paymentIntentId = null;
        let clientSecret = null;

        if (!skipCreditCard) {
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalAmount * 100),
                currency: "usd",
                metadata: { integration_check: "accept_a_payment" },
            });
            status = "pending_payment";
            paymentIntentId = paymentIntent.id;
            clientSecret = paymentIntent.client_secret;
        }

        // Create one reservation per roomId
        const reservations = await Promise.all(
            roomIds.map(roomId =>
                prisma.reservation.create({
                    data: {
                        customer: { connect: { id: customerId } },
                        hotel: { connect: { id: Number(hotelId) } },
                        roomType,
                        room: { connect: { id: Number(roomId) } },
                        arrivalDate: new Date(arrivalDate),
                        departureDate: departureDate ? new Date(departureDate) : null,
                        guests,
                        totalAmount,
                        status,
                        paymentIntentId,
                        guestName: fullName,
                        guestEmail: email,
                        guestPhone: phone,
                    },
                })
            )
        );

        res.json({ reservations, clientSecret });
    } catch (err) {
        console.error("createReservation error:", err);
        res.status(500).json({ error: err.message });
    }
}

// --- Updated: createResidentialReservation to support multiple roomIds ---
async function createResidentialReservation(req, res) {
    const {
        hotelId,
        roomType, // expected "residential"
        roomIds,
        // durationType,    // REMOVE (not in schema)
        // durationCount,   // REMOVE (not in schema)
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        skipCreditCard,
        fullName,
        email,
        phone,
    } = req.body;
    const customerId = req.user && req.user.customerProfileId;

    if (!customerId) return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    if (!hotelId) return res.status(400).json({ error: "Hotel ID is required." });
    if (!Array.isArray(roomIds) || roomIds.length === 0) {
        return res.status(400).json({ error: "At least one room must be selected." });
    }

    // Optional: validate hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: Number(hotelId) } });
    if (!hotel) return res.status(404).json({ error: "Hotel not found." });

    try {
        let paymentIntent = null;
        let status = "pending";
        let paymentIntentId = null;
        let clientSecret = null;

        if (!skipCreditCard) {
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalAmount * 100),
                currency: "usd",
                metadata: { integration_check: "accept_a_payment" },
            });
            status = "pending_payment";
            paymentIntentId = paymentIntent.id;
            clientSecret = paymentIntent.client_secret;
        }

        const reservations = await Promise.all(
            roomIds.map(roomId =>
                prisma.reservation.create({
                    data: {
                        customer: { connect: { id: customerId } },
                        hotel: { connect: { id: Number(hotelId) } },
                        roomType,
                        room: { connect: { id: Number(roomId) } },
                        arrivalDate: new Date(arrivalDate),
                        departureDate: departureDate ? new Date(departureDate) : null,
                        guests,
                        totalAmount,
                        status,
                        paymentIntentId,
                        guestName: fullName,
                        guestEmail: email,
                        guestPhone: phone,
                    },
                })
            )
        );

        res.json({ reservations, clientSecret });
    } catch (err) {
        console.error("createResidentialReservation error:", err);
        res.status(500).json({ error: err.message });
    }
}

async function getReservations(req, res) {
    const customerId = req.user && req.user.customerProfileId;

    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    }

    try {
        const reservations = await prisma.reservation.findMany({
            where: { customerId },
            orderBy: { createdAt: "desc" },
            include: {
                hotel: true,
                room: true,
            },
        });
        res.json({ reservations });
    } catch (err) {
        console.error("getReservations error:", err);
        res.status(500).json({ error: "Failed to fetch reservations." });
    }
}

async function updateReservation(req, res) {
    const reservationId = Number(req.params.id);
    const customerId = req.user && req.user.customerProfileId;
    const {
        hotelId,
        roomType,
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        // durationType,   // REMOVE (not in schema)
        // durationCount,  // REMOVE (not in schema)
    } = req.body;

    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    }

    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
        });

        if (!reservation || reservation.customerId !== customerId) {
            return res.status(403).json({ error: "Unauthorized or reservation not found." });
        }

        // Optional: If hotelId is allowed to be updated, validate it
        let hotelUpdate = {};
        if (hotelId) {
            const hotel = await prisma.hotel.findUnique({ where: { id: Number(hotelId) } });
            if (!hotel) {
                return res.status(404).json({ error: "Hotel not found." });
            }
            hotelUpdate = { hotelId: Number(hotelId) };
        }

        const updatedReservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: {
                ...hotelUpdate,
                roomType,
                arrivalDate: new Date(arrivalDate),
                departureDate: departureDate ? new Date(departureDate) : null,
                guests,
                totalAmount,
            },
        });

        res.json({ reservation: updatedReservation });
    } catch (err) {
        console.error("updateReservation error:", err);
        res.status(500).json({ error: "Failed to update reservation.", details: err.message });
    }
}

async function deleteReservation(req, res) {
    const reservationId = Number(req.params.id);
    const customerId = req.user && req.user.customerProfileId;

    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    }

    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
        });

        if (!reservation || reservation.customerId !== customerId) {
            return res.status(403).json({ error: "Unauthorized or reservation not found." });
        }

        await prisma.reservation.delete({
            where: { id: reservationId },
        });

        res.json({ message: "Reservation deleted successfully." });
    } catch (err) {
        console.error("deleteReservation error:", err);
        res.status(500).json({ error: "Failed to delete reservation.", details: err.message });
    }
}

async function getAllReservations(req, res) {
    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                customer: true,
                room: true,
                hotel: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ reservations });
    } catch (err) {
        console.error("getAllReservations error:", err);
        res.status(500).json({ error: "Failed to fetch all reservations." });
    }
}

async function createClerkReservation(req, res) {
    const {
        hotelId,
        guestName,
        guestPhone,
        guestEmail,
        roomType,
        roomNumber,
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        status,
    } = req.body;

    if (
        !hotelId ||
        !guestName ||
        !guestPhone ||
        !roomType ||
        !arrivalDate ||
        !departureDate ||
        !guests ||
        totalAmount == null ||
        !status ||
        (status === "checked-in" && !roomNumber)
    ) {
        return res.status(400).json({ error: "All required fields must be filled." });
    }

    // Optional: validate hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: Number(hotelId) } });
    if (!hotel) {
        return res.status(404).json({ error: "Hotel not found." });
    }

    try {
        const reservation = await prisma.reservation.create({
            data: {
                hotelId: Number(hotelId),
                guestName,
                guestPhone,
                guestEmail,
                roomType,
                roomNumber: roomNumber || null,
                arrivalDate: new Date(arrivalDate),
                departureDate: new Date(departureDate),
                guests,
                totalAmount,
                status,
            },
        });

        if (status === "checked-in" && roomNumber) {
            await prisma.room.update({
                where: { number: roomNumber },
                data: { status: "occupied" },
            });
        }

        res.json({ reservation });
    } catch (err) {
        console.error("createClerkReservation error:", err);
        res.status(500).json({ error: err.message });
    }
}

async function checkinReservation(req, res) {
    const { reservationId, roomNumber } = req.body;
    if (!reservationId || !roomNumber) {
        return res.status(400).json({ error: "Missing fields." });
    }
    try {
        const reservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: "checked-in", roomNumber },
        });
        await prisma.room.update({
            where: { number: roomNumber },
            data: { status: "occupied" },
        });
        res.json({ reservation });
    } catch (err) {
        console.error("checkinReservation error:", err);
        res.status(500).json({ error: err.message });
    }
}

async function checkoutReservation(req, res) {
    const { reservationId, paymentMethod, bill } = req.body;
    if (!reservationId || !bill) {
        return res.status(400).json({ error: "Missing required fields." });
    }
    try {
        const reservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: "checked-out", updatedAt: new Date() },
        });

        if (reservation.roomNumber) {
            await prisma.room.update({
                where: { number: reservation.roomNumber },
                data: { status: "available" },
            });
        }

        const billingRecord = await prisma.billingRecord.create({
            data: {
                reservationId: reservation.id,
                roomCharges: bill.roomCharges,
                restaurant: bill.restaurant,
                roomService: bill.roomService,
                laundry: bill.laundry,
                telephone: bill.telephone,
                club: bill.club,
                other: bill.other,
                lateCheckout: bill.lateCheckout,
                total: bill.total,
            },
        });

        res.json({ reservation, billingRecord });
    } catch (err) {
        console.error("checkoutReservation error:", err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    createReservation,
    createResidentialReservation,
    getReservations,
    updateReservation,
    deleteReservation,
    getAllReservations,
    createClerkReservation,
    checkinReservation,
    checkoutReservation,
};