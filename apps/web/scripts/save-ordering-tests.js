async function run() {
  let latestSeq = 0;
  let appliedSeq = 0;

  function simulateSave(delayMs) {
    latestSeq += 1;
    const seq = latestSeq;
    return new Promise((resolve) => {
      setTimeout(() => {
        if (seq === latestSeq) {
          appliedSeq = seq;
        }
        resolve(seq);
      }, delayMs);
    });
  }

  await Promise.all([simulateSave(150), simulateSave(50)]);

  if (appliedSeq !== latestSeq) {
    console.error(
      `FAIL: latest save (${latestSeq}) was not applied (applied ${appliedSeq})`,
    );
    process.exitCode = 1;
    return;
  }

  console.log("PASS: save ordering ignores stale responses");
}

run().catch((error) => {
  console.error("Save ordering tests failed:", error.message);
  process.exitCode = 1;
});
