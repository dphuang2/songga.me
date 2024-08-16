import { trpc } from "@/utils/trpc";

export default function MyComponent() {
  const hello = trpc.hello.useQuery({ text: "world" });

  if (!hello.data) return <div>Loading...</div>;

  return <div>{hello.data.greeting}</div>;
}
