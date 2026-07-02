package services

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
)

type EmailService struct {
	smtpHost string
	smtpPort string
	username string
	password string
	from     string
}

func NewEmailService(host, port, username, password, from string) *EmailService {
	return &EmailService{
		smtpHost: host,
		smtpPort: port,
		username: username,
		password: password,
		from:     from,
	}
}

func (s *EmailService) SendVerificationEmail(to, name, verifyLink string) error {
	subject := "Verify your Socio account"
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Welcome to Socio, %s!</h2>
			<p>Please verify your email address by clicking the link below:</p>
			<p>
				<a href="%s" style="background: #4F46E5; color: white; padding: 12px 24px;
					text-decoration: none; border-radius: 6px; display: inline-block;">
					Verify Email
				</a>
			</p>
			<p>Or copy and paste this link in your browser:</p>
			<p>%s</p>
			<p>This link expires in 24 hours.</p>
			<p>If you did not create this account, please ignore this email.</p>
		</body>
		</html>
	`, name, verifyLink, verifyLink)

	return s.send(to, subject, body)
}

func (s *EmailService) send(to, subject, body string) error {
	headers := map[string]string{
		"From":         s.from,
		"To":           to,
		"Subject":      subject,
		"MIME-Version": "1.0",
		"Content-Type": "text/html; charset=UTF-8",
	}

	var msg bytes.Buffer
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")

	tmpl := template.Must(template.New("email").Parse(body))
	tmpl.Execute(&msg, nil)

	auth := smtp.PlainAuth("", s.username, s.password, s.smtpHost)
	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)

	return smtp.SendMail(addr, auth, s.from, []string{to}, msg.Bytes())
}
