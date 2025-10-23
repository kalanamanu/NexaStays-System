const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require("pdfkit");
const path = require("path");

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

// --- Updated: createReservation to support multiple roomIds ---
async function createReservation(req, res) {
    const {
        hotelId,
        roomType,
        roomIds,
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        skipCreditCard,
        fullName,
        email,
        phone,
        roomNumber,
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
            status = "paid";
            paymentIntentId = paymentIntent.id;
            clientSecret = paymentIntent.client_secret;
        }

        // Create one reservation per roomId
        const reservations = await Promise.all(
            roomIds.map(async roomId => {
                // Find the room in DB to get the "number" if not provided
                let resolvedRoomNumber = roomNumber;
                if (!roomNumber) {
                    const roomObj = await prisma.room.findUnique({
                        where: { id: Number(roomId) },
                        select: { number: true }
                    });
                    resolvedRoomNumber = roomObj?.number || "";
                }

                const reservation = await prisma.reservation.create({
                    data: {
                        customer: { connect: { id: customerId } },
                        hotel: { connect: { id: Number(hotelId) } },
                        roomType,
                        room: { connect: { id: Number(roomId) } },
                        roomNumber: resolvedRoomNumber,
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
                });
                // Update room status to reserved
                await prisma.room.update({
                    where: { id: Number(roomId) },
                    data: { status: "reserved" }
                });
                return reservation;
            })
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
        roomType,
        roomIds,
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        skipCreditCard,
        fullName,
        email,
        phone,
        roomNumber,
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
            status = "paid";
            paymentIntentId = paymentIntent.id;
            clientSecret = paymentIntent.client_secret;
        }

        const reservations = await Promise.all(
            roomIds.map(async roomId => {
                // Find the room in DB to get the "number" if not provided
                let resolvedRoomNumber = roomNumber;
                if (!roomNumber) {
                    const roomObj = await prisma.room.findUnique({
                        where: { id: Number(roomId) },
                        select: { number: true }
                    });
                    resolvedRoomNumber = roomObj?.number || "";
                }

                const reservation = await prisma.reservation.create({
                    data: {
                        customer: { connect: { id: customerId } },
                        hotel: { connect: { id: Number(hotelId) } },
                        roomType,
                        room: { connect: { id: Number(roomId) } },
                        roomNumber: resolvedRoomNumber, // <-- store human room number for display
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
                });
                // Update room status to reserved
                await prisma.room.update({
                    where: { id: Number(roomId) },
                    data: { status: "reserved" }
                });
                return reservation;
            })
        );

        res.json({ reservations, clientSecret });
    } catch (err) {
        console.error("createResidentialReservation error:", err);
        res.status(500).json({ error: err.message });
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
            include: { room: true }, // <-- include room relation
        });

        if (!reservation || reservation.customerId !== customerId) {
            return res.status(403).json({ error: "Unauthorized or reservation not found." });
        }

        // Before deleting, set room status to available if there is a related room
        if (reservation.roomId) {
            await prisma.room.update({
                where: { id: reservation.roomId },
                data: { status: "available" },
            });
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

async function getReservationById(req, res) {
    const reservationId = Number(req.params.id);
    if (!reservationId) {
        return res.status(400).json({ error: "Reservation ID is required." });
    }

    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                hotel: true,
                room: true,
                customer: true,
            },
        });

        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found." });
        }

        res.json({ reservation });
    } catch (err) {
        console.error("getReservationById error:", err);
        res.status(500).json({ error: "Failed to fetch reservation." });
    }
}

async function getReservationReceipt(req, res) {
    const reservationId = Number(req.params.id);
    if (!reservationId) {
        return res.status(400).json({ error: "Reservation ID is required." });
    }

    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                hotel: true,
                room: true,
                customer: true,
            },
        });

        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found." });
        }
        if (reservation.status !== "paid") {
            return res.status(400).json({ error: "Receipt is available only for paid reservations." });
        }

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            info: {
                Title: `Receipt for Reservation #${reservationId}`,
                Author: reservation.hotel?.name || 'Hotel',
            }
        });

        let buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
            let pdfData = Buffer.concat(buffers);
            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Receipt_${reservationId}.pdf"`,
            });
            res.send(pdfData);
        });

        // Colors
        const primaryColor = "#2e3192";
        const successColor = "#19a974";
        const accentColor = "#f8ac59";
        const darkColor = "#333333";
        const lightColor = "#777777";
        const borderColor = "#e0e0e0";

        // ---- HEADER WITH BACKGROUND ----
        doc.rect(0, 0, doc.page.width, 120)
            .fill(primaryColor);

        // Hotel name and logo area
        doc.fillColor("#ffffff")
            .fontSize(24)
            .font("Helvetica-Bold")
            .text(reservation.hotel?.name || "Hotel", 50, 45);

        doc.fillColor("rgba(255,255,255,0.8)")
            .fontSize(11)
            .font("Helvetica")
            .text(reservation.hotel?.address || "", 50, 75);

        // Paid badge with better styling
        doc.circle(doc.page.width - 80, 60, 30)
            .fill(successColor);

        doc.fillColor("#ffffff")
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("PAID", doc.page.width - 95, 55, { width: 60, align: 'center' });

        doc.moveDown(4);

        // ---- RECEIPT TITLE ----
        doc.fillColor(darkColor)
            .fontSize(28)
            .font("Helvetica-Bold")
            .text("RESERVATION RECEIPT", 0, 140, { align: "center" });

        doc.moveDown(0.5);

        // Decorative line
        doc.moveTo(150, doc.y)
            .lineTo(doc.page.width - 150, doc.y)
            .lineWidth(2)
            .strokeColor(accentColor)
            .stroke();

        doc.moveDown(1.5);

        // ---- TWO COLUMN LAYOUT ----
        const leftColumn = 50;
        const rightColumn = 300;
        const currentY = doc.y;

        // Reservation Details Box
        doc.rect(leftColumn, currentY, 500, 25)
            .fill(primaryColor);

        doc.fillColor("#ffffff")
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("RESERVATION DETAILS", leftColumn + 15, currentY + 7);

        doc.moveDown(2);

        // Left Column - Guest Information
        doc.fillColor(darkColor)
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("GUEST INFORMATION:", leftColumn, doc.y);

        doc.moveDown(0.3);

        doc.fillColor(lightColor)
            .font("Helvetica")
            .text(`Name: ${reservation.guestName || "N/A"}`);
        doc.text(`Email: ${reservation.guestEmail || "N/A"}`);
        doc.text(`Phone: ${reservation.guestPhone || "N/A"}`);

        doc.moveDown(1);

        doc.fillColor(darkColor)
            .font("Helvetica-Bold")
            .text("STAY DETAILS:");

        doc.moveDown(0.3);

        doc.fillColor(lightColor)
            .font("Helvetica")
            .text(`Check-in: ${reservation.arrivalDate ? new Date(reservation.arrivalDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : "N/A"}`);

        doc.text(`Check-out: ${reservation.departureDate ? new Date(reservation.departureDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : "N/A"}`);

        doc.text(`Guests: ${reservation.guests}`);
        doc.text(`Nights: ${reservation.arrivalDate && reservation.departureDate ?
            Math.ceil((new Date(reservation.departureDate) - new Date(reservation.arrivalDate)) / (1000 * 60 * 60 * 24)) :
            "N/A"}`);

        // Right Column - Room & Payment Info
        const rightY = currentY + 40;

        doc.fillColor(darkColor)
            .font("Helvetica-Bold")
            .text("ROOM INFORMATION:", rightColumn, rightY);

        doc.moveDown(0.3);

        doc.fillColor(lightColor)
            .font("Helvetica")
            .text(`Room Type: ${reservation.roomType || "N/A"}`, rightColumn);
        doc.text(`Room Number: ${reservation.roomNumber || reservation.room?.number || "N/A"}`, rightColumn);

        doc.moveDown(1);

        doc.fillColor(darkColor)
            .font("Helvetica-Bold")
            .text("PAYMENT INFORMATION:", rightColumn);

        doc.moveDown(0.3);

        doc.fillColor(lightColor)
            .font("Helvetica")
            .text(`Reservation ID: #${reservation.id}`, rightColumn);
        doc.text(`Payment Ref: ${reservation.paymentIntentId || "N/A"}`, rightColumn);
        doc.text(`Status: ${reservation.status?.toUpperCase() || "N/A"}`, rightColumn);

        doc.moveDown(3);

        // ---- PAYMENT SUMMARY BOX ----
        const summaryY = doc.y;

        // Background for payment summary
        doc.rect(leftColumn, summaryY, 500, 80)
            .fill("#f8f9fa")
            .stroke(borderColor);

        doc.rect(leftColumn, summaryY, 500, 25)
            .fill(primaryColor);

        doc.fillColor("#ffffff")
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("PAYMENT SUMMARY", leftColumn + 15, summaryY + 7);

        // Total amount with emphasis
        doc.fillColor(successColor)
            .fontSize(24)
            .font("Helvetica-Bold")
            .text(`$${Number(reservation.totalAmount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`,
                leftColumn + 20, summaryY + 40);

        doc.fillColor(lightColor)
            .fontSize(12)
            .font("Helvetica")
            .text("Total Amount Paid", leftColumn + 20, summaryY + 65);

        doc.moveDown(5);

        // ---- FOOTER ----
        const footerY = doc.page.height - 100;

        doc.moveTo(50, footerY)
            .lineTo(doc.page.width - 50, footerY)
            .lineWidth(1)
            .strokeColor(borderColor)
            .stroke();

        doc.moveDown(1);

        doc.fillColor(lightColor)
            .fontSize(10)
            .text("Thank you for choosing us! We look forward to welcoming you.", {
                align: "center"
            });

        doc.text("This receipt serves as official proof of payment. For any inquiries, please contact the hotel directly.", {
            align: "center"
        });

        doc.moveDown(0.5);

        doc.fillColor(darkColor)
            .text(`Generated on ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, {
                align: "center"
            });

        // ---- PAGE NUMBER ----
        doc.fillColor(lightColor)
            .fontSize(8)
            .text(`Page 1 of 1`, 50, doc.page.height - 30, {
                align: "center",
                width: doc.page.width - 100
            });

        doc.end();

    } catch (err) {
        console.error("getReservationReceipt error:", err);
        res.status(500).json({ error: "Failed to generate receipt." });
    }
}

// Mark a reservation as notified
async function markReservationNotified(req, res) {
    const reservationId = Number(req.params.id);
    const customerId = req.user && req.user.customerProfileId;
    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found." });
    }
    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
        });
        if (!reservation || reservation.customerId !== customerId) {
            return res.status(403).json({ error: "Unauthorized or reservation not found." });
        }
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { customerNotified: true },
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to update notification status." });
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
    getReservationById,
    getReservationReceipt,
    markReservationNotified
};