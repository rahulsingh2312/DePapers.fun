import { IoMdInformationCircleOutline } from "react-icons/io";

const PaperFeed = () => {
  return (
    <div className="mx-10">
      <p className="text-gray-600 font-medium">
        2k+ Papers Minted and counting
      </p>
      <div className=" border-t-2 border-gray-800/20 px-10">
        <div className="flex gap-2 items-center justify-center">
          <h1 className="font-medium text-4xl text-center mt-9">
            depapers.fun
          </h1>
          <IoMdInformationCircleOutline className="text-xl cursor-pointer" title="How it works?" />
        </div>
        <div className="flex items-center justify-center mt-4">
          <input
            type="text"
            placeholder="Search for papers | mint address"
            className="w-96 p-2 border-2 border-gray-800/20 rounded-lg"
          />
          </div>
      </div>
    </div>
  );
};

export default PaperFeed;
