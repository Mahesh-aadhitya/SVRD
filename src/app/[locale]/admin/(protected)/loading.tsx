import ChakraLoader from "@/components/ChakraLoader";

export default function Loading() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <ChakraLoader size={90} />
    </div>
  );
}
