import ChakraLoader from "@/components/ChakraLoader";

export default function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <ChakraLoader size={110} />
    </div>
  );
}
