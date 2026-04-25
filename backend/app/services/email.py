import resend

from app.config import get_settings


def send_verification_email(to_email: str, token: str) -> None:
    settings = get_settings()
    verify_url = f"{settings.frontend_url}/verify-email?token={token}"
    resend.api_key = settings.resend_api_key
    resend.Emails.send({
        "from": f"{settings.mail_from_name} <{settings.mail_from}>",
        "to": [to_email],
        "subject": "Verify your email address",
        "html": _verification_html(verify_url),
    })


def send_password_reset_email(to_email: str, token: str) -> None:
    settings = get_settings()
    reset_url = f"{settings.frontend_url}/reset-password?token={token}"
    resend.api_key = settings.resend_api_key
    resend.Emails.send({
        "from": f"{settings.mail_from_name} <{settings.mail_from}>",
        "to": [to_email],
        "subject": "Reset your password",
        "html": _reset_html(reset_url),
    })


def _base_styles() -> str:
    return """font-family:'Poppins',Helvetica,Arial,sans-serif;background:#f9f9f9;color:#1a1c1c;padding:40px 20px;margin:0;"""


def _card_styles() -> str:
    return """max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:40px 32px;"""


def _button_styles() -> str:
    return """display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin:20px 0;"""


def _verification_html(verify_url: str) -> str:
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="{_base_styles()}">
  <div style="{_card_styles()}">
    <h1 style="font-size:24px;font-weight:500;margin:0 0 16px;color:#1a1c1c;">Verify your email</h1>
    <p style="font-size:16px;line-height:1.6;color:#444748;margin:0 0 8px;">
      Thanks for signing up. Click the button below to verify your email address and activate your account.
    </p>
    <a href="{verify_url}" style="{_button_styles()}">Verify Email</a>
    <p style="font-size:14px;line-height:1.5;color:#747878;margin:24px 0 0;">
      This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
    </p>
  </div>
</body></html>"""


def _reset_html(reset_url: str) -> str:
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="{_base_styles()}">
  <div style="{_card_styles()}">
    <h1 style="font-size:24px;font-weight:500;margin:0 0 16px;color:#1a1c1c;">Reset your password</h1>
    <p style="font-size:16px;line-height:1.6;color:#444748;margin:0 0 8px;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    <a href="{reset_url}" style="{_button_styles()}">Reset Password</a>
    <p style="font-size:14px;line-height:1.5;color:#747878;margin:24px 0 0;">
      This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
    </p>
  </div>
</body></html>"""
