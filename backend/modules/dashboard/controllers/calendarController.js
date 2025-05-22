const { getOAuthClient, getAuthUrl } = require("../config/googleOAuth");
const GoogleCredential = require("../models/Credentials");
const { google } = require("googleapis");
const Meeting = require("../models/Meeting");
const sendNotificationFunc = require(".././services/sendNotificationFunc");
const { default: mongoose } = require("mongoose");

exports.authorizeGoogle = (req, res) => {
  const { authUrl } = getAuthUrl();
  res.json({ authUrl });
};

exports.googleCallback = async (req, res) => {
  const oauth2Client = getOAuthClient();
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    await oauth2Client.setCredentials(tokens);

    const savedCreds = await GoogleCredential.create(tokens);

    res.json({ message: "Auth successful", credentialsId: savedCreds._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMeetingsByOwner = async (req, res) => {
  try {
    const { ownerType, ownerId } = req.params;

    // Validate ownerType
    if (!["creator", "business"].includes(ownerType)) {
      return res.status(400).json({ message: "Invalid owner type" });
    }

    // Validate ownerId
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "Invalid owner ID" });
    }

    let meetings;

    if (ownerType === "creator") {
      meetings = await Meeting.find({ creatorId: ownerId });
    } else if (ownerType === "business") {
      meetings = await Meeting.find({ businessIds: ownerId });
    }

    res.status(200).json({ message: "Meetings retrieved", data: meetings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUpcomingMeetingsForBusiness = async (req, res) => {
  const { businessId } = req.params;

  try {
    const startOfDay = new Date();

    startOfDay.setHours(0, 0, 0, 0);
    const upcomingMeetings = await Meeting.find({
      businessIds: { $in: [businessId] },
      date: { $gte: startOfDay },
    }).sort({ date: 1, time: 1 });

    res.json({
      message: "Upcoming meetings fetched successfully",
      count: upcomingMeetings.length,
      meetings: upcomingMeetings,
    });
  } catch (err) {
    console.error("Error fetching meetings:", err);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
};

exports.createEvent = async (req, res) => {
  const credentialsId = req.headers["x-credentials-id"];
  if (!credentialsId)
    return res.status(401).json({ error: "Missing credentials ID" });

  try {
    const credsDoc = await GoogleCredential.findById(credentialsId);
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      access_token: credsDoc.token,
      refresh_token: credsDoc.refresh_token,
      scope: credsDoc.scope,
      token_type: credsDoc.token_type,
      expiry_date: credsDoc.expiry_date,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const {
      name,
      description,
      start_time,
      end_time,
      projectId,
      duration,
      date,
      time,
      ownerType,
      creatorId,
      businessIds,
      attendees,
    } = req.body;

    const parsedAttendees = (
      Array.isArray(attendees) ? attendees : attendees.split(",")
    )
      .map((email) => email.trim())
      .filter(Boolean);

    const event = {
      summary: name,
      description,
      start: {
        dateTime: new Date(start_time).toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: new Date(end_time).toISOString(),
        timeZone: "Asia/Kolkata",
      },
      attendees: parsedAttendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet_${name}_${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const result = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: "all",
    });

    const meetLink = result.data.hangoutLink;

    const savedMeeting = await Meeting.create({
      name,
      description,
      projectId,
      duration,
      date,
      time,
      ownerType,
      creatorId: creatorId || null,
      businessIds: businessIds || [],
      attendees: parsedAttendees,
      meetLink,
    });

    const business = await mongoose.connection.db
      .collection("creators")
      .findOne({ _id: new mongoose.Types.ObjectId(businessIds[0]) });

    const creator = await mongoose.connection.db
      .collection("businesses")
      .findOne({ _id: new mongoose.Types.ObjectId(creatorId) });

    // await sendNotificationFunc(
    //   creatorId,
    //   "Creator",
    //   `You have been added to event- ${name}`,
    //   `Attend event ${name} on ${time}, ${date}`,
    //   creator.fcmToken
    // );
    // await sendNotificationFunc(
    //   businessIds[0],
    //   "Business",
    //   `You have been added to event- ${name}`,
    //   `Attend event ${name} on ${time}, ${date}`,
    //   business.fcmToken
    // );

    res.json({
      message: "Meeting created successfully",
      meetLink,
      eventId: result.data.id,
      htmlLink: result.data.htmlLink,
      meetingData: savedMeeting,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};
