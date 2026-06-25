import { sendTelegramMessage } from "./telegram";

describe("sendTelegramMessage", () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = "test-token";
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
    jest.restoreAllMocks();
  });

  const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

  it("returns false without a bot token", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    expect(await sendTelegramMessage(1, "hi")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("attaches the button for a public https url", async () => {
    await sendTelegramMessage(1, "hi", { button: { text: "Bid", url: "https://tutorlah.app/sos" } });
    expect(sentBody().reply_markup.inline_keyboard[0][0].url).toBe("https://tutorlah.app/sos");
  });

  it("still sends but drops the button for a localhost url", async () => {
    const ok = await sendTelegramMessage(1, "hi", { button: { text: "Bid", url: "http://localhost:3000/sos" } });
    expect(ok).toBe(true);
    expect(sentBody().text).toBe("hi");
    expect(sentBody().reply_markup).toBeUndefined();
  });

  it("drops the button for a loopback ip url", async () => {
    await sendTelegramMessage(1, "hi", { button: { text: "Bid", url: "http://127.0.0.1:3000/sos" } });
    expect(sentBody().reply_markup).toBeUndefined();
  });
});
