const mongoose = require("mongoose");

/**
 * Updates creator's project counters based on status change
 * @param {ObjectId} creatorId - Creator's MongoDB ObjectId
 * @param {String} prevStatus - Previous project status
 * @param {String} newStatus - New project status
 */

const updateCreatorProjectStatusCounts = async (
  creatorId,
  prevStatus,
  newStatus
) => {
  try {
    if (!creatorId || prevStatus === newStatus) return;

    // Define allowed forward transitions
    const allowedTransitions = {
      pending: ["to-do"],
      "to-do": ["in progress"],
    };

    const isValidTransition =
      allowedTransitions[prevStatus] &&
      allowedTransitions[prevStatus].includes(newStatus);

    if (!isValidTransition) {
      return;
    }

    const collection = mongoose.connection.db.collection("creators");
    const incObj = {};

    // Decrement previous status
    if (prevStatus === "pending") incObj["availability.pendingProjects"] = -1;
    else if (prevStatus === "to-do") incObj["availability.todoProjects"] = -1;

    // Increment new status
    if (newStatus === "to-do") incObj["availability.todoProjects"] = 1;
    else if (newStatus === "in progress")
      incObj["availability.inProgressProjects"] = 1;
    else if (newStatus === "rejected")
      incObj["availability.rejectedProjects"] = 1;

    if (Object.keys(incObj).length === 0) {
      return;
    }

    await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(creatorId) },
      { $inc: incObj }
    );
  } catch (error) {
    console.error("Error updating creator project counters:", error.message);
  }
};

// const updateCreatorProjectStatusCounts = async (creatorId, prevStatus, newStatus) => {
//     try {
//         console.log("\n========== Project Status Update Debug ==========");
//         console.log("Creator ID:", creatorId);
//         console.log("Previous Status:", prevStatus);
//         console.log("New Status:", newStatus);

//         if (!creatorId) {
//             console.log("No creator ID provided. Exiting...");
//             return;
//         }

//         if (prevStatus === newStatus) {
//             console.log("Status unchanged. No update needed.");
//             return;
//         }

//         const collection = mongoose.connection.db.collection("creators");
//         const incObj = {};

//         // Decrease old status
//         switch (prevStatus) {
//             case "pending":
//                 incObj["availability.pendingProjects"] = -1;
//                 break;
//             case "to-do":
//                 incObj["availability.todoProjects"] = -1;
//                 break;
//             case "in progress":
//                 incObj["availability.inProgressProjects"] = -1;
//                 break;
//             default:
//                 console.log("Previous status is not relevant for decrement.");
//         }

//         // Increase new status
//         switch (newStatus) {
//             case "pending":
//                 incObj["availability.pendingProjects"] = (incObj["availability.pendingProjects"] || 0) + 1;
//                 break;
//             case "to-do":
//                 incObj["availability.todoProjects"] = (incObj["availability.todoProjects"] || 0) + 1;
//                 break;
//             case "in progress":
//                 incObj["availability.inProgressProjects"] = (incObj["availability.inProgressProjects"] || 0) + 1;
//                 break;
//             default:
//                 console.log("New status is not relevant for increment.");
//         }

//         console.log("Increment Object:", incObj);

//         if (Object.keys(incObj).length === 0) {
//             console.log("Nothing to update. Exiting...");
//             return;
//         }

//         const result = await collection.updateOne(
//             { _id: new mongoose.Types.ObjectId(creatorId) },
//             { $inc: incObj }
//         );

//         console.log("MongoDB Update Result:", result);
//         console.log("========== End Debug ==========\n");
//     } catch (error) {
//         console.error("Error updating creator project counters:", error.message);
//     }
// };

module.exports = {
  updateCreatorProjectStatusCounts,
};
