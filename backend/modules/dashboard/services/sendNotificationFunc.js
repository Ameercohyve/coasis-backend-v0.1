const Notification = require("../models/Notifications.js");
const admin = require("../../../utils/firebase-admin.js");

const sendNotificationFunc = async (
  receiverId,
  receiverType,
  title,
  body,
  token = null,
  options
) => {
  try {
    await Notification.create({
      receiverId,
      receiverType, // 'Creator' or 'Business'
      title,
      body,
      isRead: false,
    });

    // If token is provided, also send push notification
    if (token) {
      const message = {
        notification: {
          title,
          body,
        },
        token,
      };

      const response = await admin.messaging().send(message);
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error: error.message };
  }
};

module.exports = sendNotificationFunc;
