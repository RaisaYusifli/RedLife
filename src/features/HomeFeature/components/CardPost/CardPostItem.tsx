import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Flex,
  Heading,
  IconButton,
  SkeletonCircle,
  SkeletonText,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  useToast,
} from "@chakra-ui/react";
import {
  BiLike,
  BiChat,
  BiSave,
  BiBookmark,
  BiSolidLike,
  BiShare,
} from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { IPost } from "../AddPost";
import { auth, db, onAuthStateChanged } from "../../../../firebase";
import CommentSection from "../Comments/CommentsSection";
import { FaEdit, FaCopy } from "react-icons/fa";
import { MdDelete, MdReport } from "react-icons/md";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBookmark } from "react-icons/fa";
import { AuthContext } from "../../../../context/AppContext";
import { useJsApiLoader } from "@react-google-maps/api";
import { mapOptions } from "../../../../MapConfig";
import { PhoneIcon } from "@chakra-ui/icons";
import { GoLocation } from "react-icons/go";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { CopyToClipboard } from "react-copy-to-clipboard";
import PostActions from "../../../../components/PostComponents/PostActions";
export interface IUser {
  uid: string
  photoURL: string
  avatar:string
}
function CardPostItem(props: IPost, key: number) {
  const [showComment, setShowComment] = useState(false);
  const { t } = useTranslation();
  
  const { id, phone, likes, comments, saved, publish_date, type, description, city, bloodGroup, fullName, avatar, coordinates, uid } = props
  const [userData, setUserData] = useState<IUser | null>(null);
  const fetchUserData = async (uid: string): Promise<IUser | null> => {
    const usersCollectionRef = collection(db, 'users');
    const userQuery = query(usersCollectionRef, where('uid', '==', uid));
    const userData = await getDocs(userQuery);

    if (userData.docs.length > 0) {
      return userData.docs[0].data() as IUser;
    }

    return null;
  };

  useEffect(() => {
    const getUserData = async () => {
      const userData = await fetchUserData(uid);
      
      setUserData(userData)
    }
    uid && getUserData()
  }, [])

  const date: any = new Date(publish_date.seconds * 1000 + publish_date.nanoseconds / 1e6);
  const now: any = new Date();

  // Calculate the time difference in seconds and minutes
  const timeDifferenceInSeconds = Math.floor((now - date) / 1000);
  const timeDifferenceInMinutes = Math.floor(timeDifferenceInSeconds / 60);

  let diffTime;

  if (timeDifferenceInSeconds < 60) {
    diffTime = `${timeDifferenceInSeconds} seconds ago`;
  } else if (timeDifferenceInMinutes < 60) {
    diffTime = `${timeDifferenceInMinutes} minutes ago`;
  } else if (timeDifferenceInMinutes >= 60 && timeDifferenceInMinutes < 1440) {
    // Calculate hours ago
    const hoursAgo = Math.floor(timeDifferenceInMinutes / 60);
    diffTime = `${hoursAgo} hours ago`;
  } else if (timeDifferenceInMinutes >= 1440) {
    // More than 1 day, show month and day
    const options = { month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options as Intl.DateTimeFormatOptions); // Cast options to the correct type
    diffTime = `Published on ${formattedDate}`;
  }

  const navigate = useNavigate();
  const triggerContext = useContext<any>(AuthContext)

  const [authChecked, setAuthChecked] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: mapOptions.googleMapApiKey,
    googleMapsApiKey: mapOptions.googleMapApiKey,     
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  let actions = {
    isILiked: false,
    isISaved: false,
  };

  if (auth.currentUser) {
    actions.isILiked = likes.includes(auth.currentUser.uid);
    actions.isISaved = saved.includes(auth.currentUser.uid);
  } else {
    actions.isILiked = false;
    actions.isISaved = false;
  }

  const addLikeHandler = () => {
    if (!auth.currentUser) return navigate("/login");
    const userDocRef = doc(db, "donors", id);

    const updateData = {
      ["likes"]: actions.isILiked
        ? arrayRemove(auth.currentUser.uid)
        : arrayUnion(auth.currentUser.uid),
    };
    updateDoc(userDocRef, updateData)
      .then(() => {
        console.log("Document successfully updated!");
      })
      .catch((error) => {
        console.error("Error updating document:", error);
      });
    triggerContext.setTrigger((curr: boolean) => !curr);
  };

  const saveClickHandler = () => {
    if (!auth.currentUser) return navigate("/login");
    const userDocRef = doc(db, "donors", id);
    const updateData = {
      ["saved"]: actions.isISaved
        ? arrayRemove(auth.currentUser.uid)
        : arrayUnion(auth.currentUser.uid),
    };
    triggerContext.setTrigger((curr: boolean) => !curr);

    updateDoc(userDocRef, updateData)
      .then(() => {
        console.log("Document successfully updated!");
      })
      .catch((error) => {
        console.error("Error updating document:", error);
      });
  };


  return (
    <Flex justifyContent="center" my="2" key={key}>
      <Card w="2xl">
        <CardHeader>
          <Flex gap="4">
            <Flex
              flex="1"
              gap="4"
              alignItems="center"
              flexWrap="wrap"
              justifyContent={"space-between"}
            >
              <Flex alignItems={"center"} gap={"2"}>
                <Avatar
                  name={fullName}
                  src={userData?.avatar}
                  borderColor="green.500"
                  borderWidth="2px"
                  bg={"black"}
                />
                <Box w={'100%'}>
                  <Flex justifyContent={'space-between'}>

                    <Heading size="md">{fullName}</Heading>
                    <Text pl={'3'}>{diffTime}</Text>
                  </Flex>
                  <Flex
                    alignItems="center"
                    w={"full"}
                    onClick={() => {
                      navigate("/" + id);
                    }}
                    cursor={"pointer"}
                  >
                    <Text
                      fontWeight={"500"}
                      color={"#445760"}
                      display={"block"}
                    >
                      {<PhoneIcon />} {phone}
                    </Text>
                    <Text
                      color={"#445760"}
                      fontWeight={"bold"}
                      display={"flex"}
                      alignItems={"center"}
                      gap={"1"}
                      pl={"3"}
                    >
                      {<GoLocation />} {city.length > 20 ? city.substring(0, 19) + '...' : city}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
              <Flex alignItems={"center"} gap={"2"}>
                <Flex>
                  <Text
                    bg={type === "Acceptor" ? "green.500" : "red.500"}
                    color="white"
                    p="1"
                    borderRadius="md"
                    h="35px"
                    w="110px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {type} {bloodGroup}
                  </Text>
                </Flex>
                <Text ml="5px"></Text>
                <PostActions id={id} uid={uid} />
              </Flex>
            </Flex>
          </Flex>
        </CardHeader>
        <CardBody
          onClick={() => {
            navigate("/" + id);
          }}
          cursor={"pointer"}
        >
          <Text>{description}</Text>
        </CardBody>
        <Divider color={"lightgray"} />
        <CardFooter
          justify="space-between"
          flexWrap="wrap"
          sx={{
            paddingTop: "2",
            paddingBottom: "2",
            "& > button": {
              minW: "136px",
            },
          }}
        >
          <Button
            flex="2"
            variant="ghost"
            leftIcon={
              actions.isILiked ? (
                <BiSolidLike size={20} color="#166fe5" />
              ) : (
                <BiLike size={20} />
              )
            }
            isDisabled={!authChecked}
            onClick={() => addLikeHandler()}
          >
            {likes?.length || "0"}
          </Button>
          <Button
            flex="2"
            variant="ghost"
            leftIcon={<BiChat size={20} />}
            isDisabled={!authChecked}
            onClick={() => {
              setShowComment(!showComment);
            }}
          >
            {comments?.length || "0"}
          </Button>
          <Button
            flex="1"
            variant="ghost"
            leftIcon={
              actions.isISaved ? (
                <FaBookmark size={20} color="#166fe5" />
              ) : (
                <BiBookmark size={20} />
              )
            }
            isDisabled={!authChecked}
            onClick={() => {
              saveClickHandler();
            }}
          >
            {actions.isISaved ? t("CardSaved") : t("CardSave")}
          </Button>

          <Popover>
            <PopoverTrigger>
              <Button
                flex="1"
                variant="ghost"
                leftIcon={<BiShare size={20} />}
              ></Button>
            </PopoverTrigger>
            <PopoverContent
              borderRadius={"15px"}
              bgColor={"gray.50"}
              w={"auto"}
              minW={"140px"}
              p={"2"}
            >
              <Flex gap={"2"}>
                <FacebookShareButton
                  url={window.location.href + id}
                  hashtag="#redlife"
                >
                  <FacebookIcon size={32} round />
                </FacebookShareButton>
                <TwitterShareButton url={window.location.href + id}>
                  <TwitterIcon size={32} round />
                </TwitterShareButton>
                <WhatsappShareButton url={window.location.href + id}>
                  <WhatsappIcon size={32} round />
                </WhatsappShareButton>
                <LinkedinShareButton url={window.location.href + id}>
                  <LinkedinIcon size={32} round />
                </LinkedinShareButton>
              </Flex>
            </PopoverContent>
          </Popover>
        </CardFooter>
        {showComment && <CommentSection {...props} />}

        {/* {showPost && (
                    <CardPostItemDetails {...props}/>
                )} */}
      </Card>
    </Flex>
  );
}

export default CardPostItem;
