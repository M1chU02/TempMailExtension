document
  .getElementById("generate-email")
  .addEventListener("click", async () => {
    try {
      // Fetch the available domains
      const response = await fetch("https://api.mail.gw/domains");
      if (!response.ok) throw new Error("Failed to fetch domains");

      const data = await response.json();
      console.log("Domains:", data);

      if (!data["hydra:member"] || data["hydra:member"].length === 0) {
        throw new Error("No domains available");
      }

      const domain = data["hydra:member"][0].domain;

      // Create a new email account
      const emailAddress = `user${Math.floor(Math.random() * 10000)}@${domain}`;
      const emailPassword = "randompassword";

      const emailResponse = await fetch("https://api.mail.gw/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: emailAddress,
          password: emailPassword,
        }),
      });

      if (!emailResponse.ok) throw new Error("Failed to create email account");

      const emailData = await emailResponse.json();
      const email = emailData.address;

      document.getElementById("email").textContent = `Email: ${email}`;

      // Fetch emails for the new account
      await fetchEmails(email, emailPassword);
    } catch (error) {
      console.error(error);
      alert("An error occurred: " + error.message);
    }
  });

async function fetchEmails(email, password) {
  try {
    // Obtain a token for the email account
    const tokenResponse = await fetch("https://api.mail.gw/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: email,
        password: password,
      }),
    });

    if (!tokenResponse.ok) {
      const errorDetails = await tokenResponse.json();
      console.error("Token Request Error Details:", errorDetails);
      throw new Error("Failed to obtain token");
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.token;

    // Poll for new messages
    pollMessages(token);
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching messages: " + error.message);
  }
}

async function pollMessages(token) {
  try {
    // Fetch the messages for the email account
    const messagesResponse = await fetch("https://api.mail.gw/messages", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!messagesResponse.ok) throw new Error("Failed to fetch messages");

    const messagesData = await messagesResponse.json();
    console.log("Messages Data:", messagesData);

    // Handle messages data structure
    const messages = messagesData["hydra:member"];
    if (!Array.isArray(messages)) {
      throw new Error("Messages data is not an array");
    }

    const messagesContainer = document.getElementById("messages");
    messagesContainer.innerHTML = "";

    messages.forEach((message) => {
      const li = document.createElement("li");
      li.textContent = `${message.subject} - ${message.from.address}`;
      const p = document.createElement("p");
      p.textContent = `${message.intro}`;
      messagesContainer.appendChild(li);
      messagesContainer.appendChild(p);
    });

    // Continue polling if no messages are found
    if (messages.length === 0) {
      setTimeout(() => pollMessages(token), 5000); // Poll every 5 seconds
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while fetching messages: " + error.message);
  }
}
