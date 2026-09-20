import EmailCopy from "./EmailCopy";
import SpaceShooterStrip from "./SpaceShooterStrip";

const email = "cindykan2012@sina.com";
const phone = "158***29469";
const wechat = "cindykhan";

export default function ContactSection() {
  return (
    <section id="contact" className="contact-section">
      <div className="page-container contact-section-inner">
        <p className="contact-section-label">
          <span>CONTACT</span>
          <span aria-hidden="true">/</span>
          <span lang="zh-CN">联系我</span>
        </p>

        <h2 className="contact-title" lang="zh-CN">
          期待与你<span className="home-title-accent">合作</span>
          <br />
          创造<span className="home-title-accent">打动用户</span>的设计体验
        </h2>

        <div className="contact-intro">
          <p lang="zh-CN">
            无论是项目合作、产品设计、体验优化，还是关于设计方向的交流，都欢迎联系我。
            如果你有具体需求，可以直接通过 Email、电话或微信联系。
          </p>
        </div>

        <div className="contact-groups">
          <section className="contact-group" aria-labelledby="direct-email-title">
            <h3 id="direct-email-title">DIRECT <span className="home-title-accent">EMAIL</span></h3>
            <EmailCopy
              href={`mailto:${email}`}
              icon="mail"
              value={email}
              variant="primary"
            />
          </section>

          <section className="contact-group" aria-labelledby="direct-contact-title">
            <h3 id="direct-contact-title">DIRECT <span className="home-title-accent">CONTACT</span> / 电话与微信</h3>
            <div className="contact-method-grid">
              <EmailCopy
                href={`tel:${phone}`}
                icon="phone"
                label="PHONE / 电话"
                value={phone}
              />
              <EmailCopy
                icon="wechat"
                label="WECHAT / 微信"
                value={wechat}
              />
            </div>
          </section>
        </div>

      </div>

      <SpaceShooterStrip />

      <div className="page-container contact-section-inner">
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
