import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";

import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useColorModeValue,
  chakra,
  Box,
} from "@chakra-ui/react";
import { createUserSession, getUserId } from "~/session.server";
import { verifyLogin } from "~/models/user.server";
import { validateEmail } from "~/utils";
import { ChakraRemixLink } from "~/components/factory";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

interface ActionData {
  errors?: {
    email?: string;
    password?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo");
  const remember = formData.get("remember");

  if (!validateEmail(email)) {
    return json<ActionData>(
      { errors: { email: "Email is invalid" } },
      { status: 400 }
    );
  }

  if (typeof password !== "string") {
    return json<ActionData>(
      { errors: { password: "Password is required" } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json<ActionData>(
      { errors: { password: "Password is too short" } },
      { status: 400 }
    );
  }

  const user = await verifyLogin(email, password);

  if (!user) {
    return json<ActionData>(
      { errors: { email: "Invalid email or password" } },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: remember === "on" ? true : false,
    redirectTo: typeof redirectTo === "string" ? redirectTo : "/notes",
  });
};

export const meta: MetaFunction = () => {
  return {
    title: "Login",
  };
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/notes";
  const actionData = useActionData() as ActionData | undefined;
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Flex
      minH={"100vh"}
      direction="column"
      justify="center"
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      <chakra.div mx="auto" w="full" maxW="md" px="8">
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          p={8}
        >
          <Form method="post" noValidate>
            <Flex direction="column" gap="6">
              <FormControl
                isInvalid={actionData?.errors?.email ? true : undefined}
              >
                <FormLabel
                  htmlFor="email"
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                >
                  Email address
                </FormLabel>
                <Input
                  ref={emailRef}
                  id="email"
                  required
                  autoFocus={true}
                  name="email"
                  type="email"
                  autoComplete="email"
                  mt="1"
                />
                <FormErrorMessage>{actionData?.errors?.email}</FormErrorMessage>
              </FormControl>

              <FormControl
                isInvalid={actionData?.errors?.password ? true : undefined}
              >
                <FormLabel
                  htmlFor="password"
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                >
                  Password
                </FormLabel>
                <Input
                  id="password"
                  ref={passwordRef}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  mt="1"
                />
                <FormErrorMessage>
                  {actionData?.errors?.password}
                </FormErrorMessage>
              </FormControl>

              <input type="hidden" name="redirectTo" value={redirectTo} />
              <Button type="submit" colorScheme="blue">
                Log in
              </Button>
              <Flex direction="column" align="center" justify="space-between">
                <Checkbox id="remember" name="remember">
                  Remember me
                </Checkbox>

                <chakra.div textAlign="center" fontSize="sm" color="gray.500">
                  Don't have an account?{" "}
                  <ChakraRemixLink
                    color="blue.500"
                    textDecor="underline"
                    to={{
                      pathname: "/join",
                      search: searchParams.toString(),
                    }}
                  >
                    Sign up
                  </ChakraRemixLink>
                </chakra.div>
              </Flex>
            </Flex>
          </Form>
        </Box>
      </chakra.div>
    </Flex>
  );
}
