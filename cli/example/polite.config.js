module.exports = {
  procedures: [require("@polite/scaffold"), require("@polite/spec")],
  scaffold: {
    stubs_path: "./stubs",
    plugins: [require("@polite/scaffold-react")]
  }
};
