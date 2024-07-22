import { faker } from "@faker-js/faker";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import { Chat } from "../models/chat.js";
import { Message } from "../models/mesaage.js";

const createUsers = async (numUsers) => {
  const users = [];
  for (let i = 0; i < numUsers; i++) {
    const name = faker.name.fullName();
    const username = faker.internet.userName();
    const password = await bcrypt.hash("Admin@123", 10); // Use a common password for simplicity, change as needed
    const bio = faker.lorem.sentence();
    const avatar = {
      public_id: faker.datatype.uuid(), // Generate a unique ID for public_id
      url: faker.image.avatar(),
    };

    const user = new User({
      name,
      username,
      password,
      bio,
      avatar,
    });

    users.push(user);
  }

  await User.insertMany(users);
  console.log(`${numUsers} fake users created successfully!`);
};

const createChats = async (numChats) => {
  const chats = [];
  const users = await User.find(); // Fetch all users to use as creators and members

  if (users.length === 0) {
    console.log("No users found in the database. Please create users first.");
    return;
  }

  for (let i = 0; i < numChats; i++) {
    const name = faker.lorem.words();
    const groupChat = faker.datatype.boolean();
    const creator = faker.helpers.arrayElement(users)._id;

    let members = [creator]; // Start with the creator as a member

    if (groupChat) {
      // Ensure a minimum of 3 members including the creator
      const numberOfMembers = faker.datatype.number({
        min: 2,
        max: Math.min(99, users.length - 1),
      });
      members = members.concat(
        faker.helpers
          .arrayElements(
            users.filter((user) => user._id !== creator),
            numberOfMembers
          )
          .map((user) => user._id)
      );
    } else {
      // If not groupChat, add one more user to make two members total
      const additionalMember = faker.helpers.arrayElement(
        users.filter((user) => user._id !== creator)
      );
      members.push(additionalMember._id);
    }

    const chat = new Chat({
      name,
      groupChat,
      creator,
      members,
    });

    chats.push(chat);
  }

  await Chat.insertMany(chats);
  console.log(`${numChats} fake chats created successfully!`);
};

const createMessages = async (numMessages, chatId) => {
  const messages = [];
  const users = await User.find(); // Fetch all users to use as senders

  if (users.length === 0) {
    console.log("No users found in the database. Please create users first.");
    return;
  }

  for (let i = 0; i < numMessages; i++) {
    const sender = faker.helpers.arrayElement(users)._id;
    const content = faker.lorem.sentence();

    // Optionally add attachments
    const hasAttachments = faker.datatype.boolean();
    const attachments = hasAttachments
      ? [
          {
            public_id: faker.datatype.uuid(), // Generate a unique ID for attachment
            url: faker.image.imageUrl(), // Generate a random image URL
          },
        ]
      : [];

    const message = new Message({
      sender,
      chat: chatId, // Use the provided chatId
      content,
      attachments,
    });

    messages.push(message);
  }

  await Message.insertMany(messages);
  console.log(
    `${numMessages} fake messages created successfully for chat ${chatId}!`
  );
};

export { createUsers, createChats, createMessages };
