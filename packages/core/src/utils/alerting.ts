import logger from './logger.js';

interface Alert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  context?: Record<string, unknown>;
}

export class Alerting {
  static async sendAlert(alert: Alert): Promise<void> {
    logger.warn(alert, 'Alert triggered');

    // Send to Slack, PagerDuty, email, etc.
    if (alert.severity === 'critical') {
      await this.sendToSlack(alert);
      await this.sendToPagerDuty(alert);
    } else if (alert.severity === 'high') {
      await this.sendToSlack(alert);
    }
  }

  private static async sendToSlack(alert: Alert): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (webhookUrl === undefined || webhookUrl === '') return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${alert.title}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${alert.title}*\n${alert.message}`
              }
            }
          ]
        })
      });
    } catch (error) {
      logger.error({ error, alert }, 'Failed to send Slack alert');
    }
  }

  private static async sendToPagerDuty(alert: Alert): Promise<void> {
    // Implement PagerDuty integration
    logger.info({ alert }, 'PagerDuty integration not yet implemented');
  }
}
