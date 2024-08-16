import { createTRPCReact } from "@trpc/react-query";
import { appRouter, type AppRouter } from "@/app/server/routers/_app";
import { createCallerFactory } from "@/app/server/trpc";

export const trpc = createTRPCReact<AppRouter>();
const callerFactory = createCallerFactory(appRouter);
export const caller = callerFactory({
  foo: "bar",
});
