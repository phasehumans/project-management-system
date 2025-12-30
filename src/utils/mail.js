import Mailgen from "mailgen";
import nodemailer from "nodemailer"

const sendMail= async (options) => {
    const mailGenerator= new Mailgen({
        theme: 'default',
        product: {
            name: 'Project Managment System',
            link: 'https://pms.com'
        }
    })

    const emailHtml = mailGenerator.generate(options.mailgenContent);

    // Generate the plaintext version of the e-mail (for clients that do not support HTML)
    const emailText = mailGenerator.generatePlaintext(options.mailgenContent);


    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.MAILTRAP_USERNAME,
            pass: process.env.MAILTRAP_PASSWORD,
        },
    });


    const mail= {
        from: process.env.MAILTRAP_SENDERMAIL,
        to: options.email, // receiver's mail
        subject: options.subject, // mail subject
        text: emailText, // mailgen content textual variant
        html: emailHtml, // mailgen content html variant
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {

        // As sending email is not strongly coupled to the business logic it is not worth to raise an error when email sending fails
        // So it's better to fail silently rather than breaking the app

        console.error("email service failed silently, Make sure you have provided your MAILTRAP credentials in the .env file")
        console.error("error:", error)
    }

}


// email content
const emailVerificationMailgenContent= (username, verficationUrl) =>{
    return {
        body: {
            name: username,
            intro: 'Welcome to DevBoard! We\'re very excited to have you on board.',
            action: {
                instructions: 'To verify your email, please click here:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Verify your email',
                    link: verficationUrl
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
}

const forgotPasswordMailgenContent= (username, passwordResetUrl) =>{
    return {
        body: {
            name: username,
            intro: 'We got a request to reset the password for your account',
            action: {
                instructions: 'To reset password, click on the following button',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Reset Password',
                    link: passwordResetUrl
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
}


export {sendMail, emailVerificationMailgenContent, forgotPasswordMailgenContent}