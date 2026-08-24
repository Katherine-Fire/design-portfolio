import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import EmailCopy from "./EmailCopy";

const email = "name@email.com";
const phone = "+86 xxx xxxx xxxx";
const wechatQrPath = "/contact/wechat-qr.png";

export default function ContactSection() {
  const hasWechatQr = existsSync(
    join(process.cwd(), "public", "contact", "wechat-qr.png"),
  );

  return (
    <section id="contact" className="contact-section">
      <div className="page-container contact-section-inner">
        <h2 className="contact-heading">
          <span>CONTACT</span>
          <span className="contact-heading-divider" aria-hidden="true">/</span>
          <span lang="zh-CN">联系我</span>
        </h2>

        <div className="contact-intro">
          <p className="contact-intro-primary" lang="zh-CN">
            期待新的设计合作，
            <br />
            也欢迎交流产品、AI 与数字体验。
          </p>
          <p className="contact-intro-secondary">
            LET&apos;S TALK ABOUT
            <br />
            PRODUCT, AI &amp; DIGITAL EXPERIENCE.
          </p>
        </div>

        <div className="contact-layout">
          <div className="contact-details">
            <EmailCopy email={email} />

            <div className="contact-supporting">
              <div className="contact-item">
                <p className="contact-label">PHONE</p>
                <a href="tel:+86xxxxxxxxxxx">{phone}</a>
              </div>

              <div className="contact-item">
                <p className="contact-label">RESUME</p>
                <a href="/resume">
                  VIEW RESUME <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>

          <aside className="contact-wechat" aria-labelledby="contact-wechat-title">
            <p id="contact-wechat-title" className="contact-label">
              WECHAT / 微信
            </p>

            <div className="contact-qr-frame">
              <div className="contact-qr-media">
                {hasWechatQr ? (
                  <Image
                    src={wechatQrPath}
                    alt="Cindy Kan WeChat QR code"
                    fill
                    sizes="(max-width: 760px) 220px, 300px"
                    className="contact-qr-image"
                  />
                ) : (
                  <div className="contact-qr-placeholder" aria-hidden="true">
                    QR CODE
                  </div>
                )}
              </div>
            </div>

            <p className="contact-qr-caption">SCAN TO CONNECT</p>
          </aside>
        </div>

        <footer className="contact-footer">
          <div>
            <p>CINDY KAN</p>
            <p>PRODUCT / UI · AI / INTERACTION</p>
          </div>
          <p>© 2026</p>
        </footer>
      </div>
    </section>
  );
}
