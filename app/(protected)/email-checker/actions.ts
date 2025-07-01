"use server";

const api_key = process.env.HUNTER_API_KEY;

export const verifyEmail = async (email: string) => {

    console.log(api_key);
    try {
        const res = await fetch(`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${api_key}`);

        if (!res.ok) {
            throw new Error("Failed to verify the email");
        }

        const data = await res.json();
        console.log(data);
        return data;

    } catch (error) {
        console.error(error);
    }
}

export const findEmail = async (domain: string, first_name: string, last_name: string) => {

    console.log(api_key);
    try {
        const res = await fetch(`https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${first_name}&last_name=${last_name}&api_key=${api_key}`);

        if (!res.ok) {
            throw new Error("Failed to find the email");
        }

        const data = await res.json();
        console.log(data);
        return data;

    } catch (error) {
        console.error(error);
    }
}

export const emailCounter = async (domain: string) => {

    console.log(api_key);
    try {
        const res = await fetch(`https://api.hunter.io/v2/email-count?domain=${domain}&api_key=${api_key}`);

        if (!res.ok) {
            throw new Error("Failed to count the emails");
        }

        const data = await res.json();
        console.log(data);
        return data;

    } catch (error) {
        console.error(error);
    }
}