import { Alert, Options, Toolbar } from "./components";
import { PageWrapper } from "../../components/wrapper";
import { useUserContext } from "../../context/userContext";
import Logo from "../../components/logo";
import ProfilePicture from "../../components/profilePicture";

const LoobyPage = () => {
  const { isAuth = false, serviceError = false } = useUserContext();

  return (
    <PageWrapper leftOption={<ProfilePicture />}>
      <Logo />
      <Options serviceError={serviceError} />
      {serviceError && <Alert />}
      <Toolbar isAuth={isAuth} />
    </PageWrapper>
  );
};

export default LoobyPage;
