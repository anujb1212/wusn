-- CreateTable
CREATE TABLE "SensorData" (
    "id" SERIAL NOT NULL,
    "nodeId" INTEGER NOT NULL,
    "cropType" TEXT NOT NULL,
    "moisture" INTEGER NOT NULL,
    "temperature" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorData_pkey" PRIMARY KEY ("id")
);
