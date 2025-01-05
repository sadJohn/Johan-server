import { JohanErr } from "@/lib/error";
import { ErrorHandler } from "hono";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

export const errorHandler: ErrorHandler = async (error, c) => {
  console.log("ERROR - ", error);
  if (error instanceof ZodError) {
    c.status(StatusCodes.BAD_REQUEST);
    return c.json({
      message: `${error.errors[0].path} - ${error.errors[0].message}`,
      data: null,
    });
  }

  if (error instanceof JohanErr) {
    c.status(error.status);
    return c.json({ message: error.message, data: null });
  }
  c.status(StatusCodes.INTERNAL_SERVER_ERROR);
  return c.json({ message: "Internal server error!", data: null });
};
