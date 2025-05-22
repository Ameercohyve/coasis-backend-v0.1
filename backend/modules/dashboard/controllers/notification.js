const Notification = require("../models/Notifications.js");
const sendNotificationFunc = require("../services/sendNotificationFunc.js");

// export const SendNotification = async (req, res) => {
//   try {
//     let { receiverId, receiverType, title, body, token } = req.body;

//     // Validate required fields
//     if (!receiverId || !receiverType || !title || !body || !token) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Missing required fields: receiverId, receiverType, title, and body are required",
//       });
//     }

//     // Find the receiver to get their notification token if available
//     let receiver;

//     if (receiverType === "Creator") {
//       receiver = await mongoose.connection.db
//         .collection("creators")
//         .findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
//     } else if (receiverType === "Business") {
//       receiver = await mongoose.connection.db
//         .collection("businesses")
//         .findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
//     }

//     if (!receiver) {
//       return res.status(404).json({
//         success: false,
//         message: `${receiverType} with ID ${receiverId} not found`,
//       });
//     }

//     // Get notification token if available
//     if (receiver.fcmToken) {
//       token = receiver.fcmToken;
//     }

//     // Send notification
//     const result = await sendNotificationFunc(
//       receiverId,
//       receiverType,
//       title,
//       body,
//       token
//     );

//     if (result.success) {
//       return res.status(200).json({
//         success: true,
//         message: "Notification sent successfully",
//       });
//     } else {
//       throw new Error(result.error);
//     }
//   } catch (error) {
//     console.error("Error in notification controller:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to send notification",
//       error: error.message,
//     });
//   }
// };

const GetNotifications = async (req, res) => {
  try {
    const receiverId = req.user.id;
    let receiverType = req.user.userType;
    receiverType = receiverType.charAt(0).toUpperCase() + receiverType.slice(1);

    const { page = 1, limit = 10 } = req.query;

    // Validate receiver type
    // if (!["creator", "business"].includes(receiverType)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'receiverType must be either "Creator" or "Business"',
    //   });
    // }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find notifications
    const notifications = await Notification.find({
      receiverId,
      receiverType,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Notification.countDocuments({
      receiverId,
      receiverType,
    });

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

const MarkAllAsRead = async (req, res) => {
  try {
    const receiverId = req.user.id;
    let receiverType = req.user.userType;
    receiverType = receiverType.charAt(0).toUpperCase() + receiverType.slice(1);

    const result = await Notification.updateMany(
      {
        receiverId,
        receiverType,
        $or: [
          { read: false },
          { read: { $exists: false } }, // Also mark notifications where read field doesn't exist
        ],
      },
      {
        $set: { read: true },
      }
    );

    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};

module.exports = {
  GetNotifications,
  MarkAllAsRead,
};
