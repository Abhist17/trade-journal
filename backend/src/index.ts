import express from "express";
import cors from "cors";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";

const app = express();

// Correct way: pass the full file URL to the adapter
const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",  // This is required for the adapter to work
});

const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Trade Journal backend is running! 🚀");
});

app.delete("/trades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.trade.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete trade" });
  }
});

app.get("/trades", async (req, res) => {
  const trades = await prisma.trade.findMany({
    orderBy: { entryDate: "desc" },
  });
  res.json(trades);
});

app.post("/trades", async (req, res) => {
  const trade = await prisma.trade.create({
    data: req.body,
  });
  res.json(trade);
});
app.patch("/trades/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const trade = await prisma.trade.update({
      where: { id },
      data: updatedData,
    });

    res.json(trade); // return the updated trade
  } catch (err) {
    console.error("PATCH error:", err);
    res.status(500).json({ error: "Failed to update trade" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});