import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

type CapsuleKey = "osta" | "rad" | "card";
type DailyCapsules = Record<CapsuleKey, number>;

type ProgressDoc = {
  _id: "singleton";
  checkedDays: Record<string, boolean>;
  dailyCapsules: Record<string, DailyCapsules>;
  startDate?: string;
  updatedAt: Date;
};

const DB_NAME = "cycle";
const COLLECTION = "progress";
const DOC_ID: ProgressDoc["_id"] = "singleton";

function defaultProgress(): Omit<ProgressDoc, "updatedAt"> {
  return {
    _id: DOC_ID,
    checkedDays: {},
    dailyCapsules: {},
    startDate: undefined,
  };
}

export async function GET() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<ProgressDoc>(COLLECTION);

  const doc = await collection.findOne({ _id: DOC_ID });
  if (!doc) {
    return NextResponse.json(defaultProgress());
  }

  return NextResponse.json({
    _id: DOC_ID,
    checkedDays: doc.checkedDays ?? {},
    dailyCapsules: doc.dailyCapsules ?? {},
    startDate: doc.startDate ?? undefined,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<
    Pick<ProgressDoc, "checkedDays" | "dailyCapsules" | "startDate">
  >;

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<ProgressDoc>(COLLECTION);

  const checkedDays =
    body.checkedDays && typeof body.checkedDays === "object" ? body.checkedDays : {};
  const dailyCapsules =
    body.dailyCapsules && typeof body.dailyCapsules === "object" ? body.dailyCapsules : {};
  const startDate = typeof body.startDate === "string" ? body.startDate : undefined;

  await collection.updateOne(
    { _id: DOC_ID },
    {
      $set: {
        checkedDays,
        dailyCapsules,
        startDate,
        updatedAt: new Date(),
      },
      $setOnInsert: { _id: DOC_ID },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}

