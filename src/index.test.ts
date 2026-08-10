import { main, projectName } from "./index";

describe("bootstrap entry point", () => {
  it("identifies the project", () => {
    expect(projectName).toBe("Soft Factory Runner");
  });

  it("reports that feature commands are delivered through RPIV", () => {
    const write = jest
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    main();

    expect(write).toHaveBeenCalledWith(
      "Soft Factory Runner is bootstrapped. Product commands will be delivered through RPIV.\n",
    );
    write.mockRestore();
  });
});
