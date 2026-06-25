import { CandidateTutor, selectSosRecipients } from "./recipients";

const tutor = (tutorId: string, chatId: number): CandidateTutor => ({ tutorId, chatId });

describe("selectSosRecipients", () => {
  it("returns an empty array for no candidates", () => {
    expect(selectSosRecipients([], ["requester"])).toEqual([]);
  });

  it("keeps every distinct candidate when nobody is excluded", () => {
    expect(selectSosRecipients([tutor("a", 1), tutor("b", 2)], [])).toEqual([1, 2]);
  });

  it("drops the requester", () => {
    expect(selectSosRecipients([tutor("a", 1), tutor("b", 2)], ["a"])).toEqual([2]);
  });

  it("drops the requester and the winning tutor for a taken sos", () => {
    expect(selectSosRecipients([tutor("a", 1), tutor("b", 2), tutor("c", 3)], ["a", "c"])).toEqual([2]);
  });

  it("dedupes repeated chat ids", () => {
    expect(selectSosRecipients([tutor("a", 1), tutor("b", 1), tutor("c", 2)], [])).toEqual([1, 2]);
  });

  it("returns empty when every candidate is excluded", () => {
    expect(selectSosRecipients([tutor("a", 1), tutor("b", 2)], ["a", "b"])).toEqual([]);
  });

  it("ignores an excluded id that is not among the candidates", () => {
    expect(selectSosRecipients([tutor("a", 1)], ["zzz"])).toEqual([1]);
  });
});
