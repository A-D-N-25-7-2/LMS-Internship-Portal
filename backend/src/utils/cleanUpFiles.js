import fs from "fs";

const cleanUpFiles = (FilePath) => {
  if (FilePath && fs.existsSync(FilePath)) {
    fs.unlinkSync(FilePath);
  }
};

export { cleanUpFiles };
