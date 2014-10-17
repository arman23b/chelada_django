-- MySQL dump 10.13  Distrib 5.5.35, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: chelada
-- ------------------------------------------------------
-- Server version	5.5.35-0ubuntu0.12.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cans`
--

DROP TABLE IF EXISTS `cans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `owner_id` int(11) NOT NULL,
  `content` text COLLATE latin1_general_ci NOT NULL,
  `token` varchar(40) COLLATE latin1_general_ci NOT NULL DEFAULT '0',
  `can_name` varchar(50) COLLATE latin1_general_ci NOT NULL,
  `view_permission` varchar(10) COLLATE latin1_general_ci NOT NULL DEFAULT 'private',
  `edit_permission` varchar(10) COLLATE latin1_general_ci NOT NULL DEFAULT 'listed',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=101 DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cans`
--

LOCK TABLES `cans` WRITE;
/*!40000 ALTER TABLE `cans` DISABLE KEYS */;
INSERT INTO `cans` VALUES (100,1,'{\"can-name\":\"CMU\",\"view-permission\":\"public\",\"edit-permission\":\"owner\",\"editors\":\"\",\"can-icon\":\"\",\"tasks\":[{\"task-name\":\"Getting to CMU\",\"triggers\":[{\"if\":[{\"block-type\":\"Location\",\"loc-rel\":\"Out of\",\"address\":\"Carnegie Mellon University\",\"radius\":\"1000\",\"metric\":\"Feet\"},{\"block-type\":\"And\"},{\"block-type\":\"Times executed\",\"amount\":\"1\"}],\"then\":[{\"block-type\":\"Show Map\",\"map-type\":\"Show direction\",\"title\":\"Direction to CMU Campus\",\"content\":\"Direction to CMU campus from your current location\",\"sticky\":\"Regular\",\"latitude\":\"40.443604\",\"longitude\":\"-79.942848\",\"zoom\":\"13\"}]}]},{\"task-name\":\"CMU Navigation\",\"triggers\":[{\"if\":[{\"block-type\":\"Location\",\"loc-rel\":\"In\",\"address\":\"Carnegie Mellon University\",\"radius\":\"500\",\"metric\":\"Feet\"},{\"block-type\":\"And\"},{\"block-type\":\"Times executed\",\"amount\":\"1\"}],\"then\":[{\"block-type\":\"Push Image\",\"url\":\"http:\\/\\/www.cmu.edu\\/qolt\\/Events\\/images\\/gaps_cmu_map.jpg\",\"sticky\":\"Regular\",\"title\":\"Campus Tour\",\"content\":\"CMU campus map\"}]}]},{\"task-name\":\"NSH Navigation\",\"triggers\":[{\"if\":[{\"block-type\":\"Location\",\"loc-rel\":\"In\",\"address\":\"Newell Simon Hall, Pittsburgh PA\",\"radius\":\"400\",\"metric\":\"Feet\"},{\"block-type\":\"And\"},{\"block-type\":\"Times executed\",\"amount\":\"1\"}],\"then\":[{\"block-type\":\"Push Image\",\"url\":\"http:\\/\\/www.cs.cmu.edu\\/~.\\/earthware\\/NSHAtrium.JPG\",\"sticky\":\"Regular\",\"title\":\"Map of Newell Simon Hall\",\"content\":\"(Assume this is a building map of NSH)\"}]}]}]}','cb732a907887b67a937ef46d6e8a4f64','CMU','public','owner');
/*!40000 ALTER TABLE `cans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `edit_permissions`
--

DROP TABLE IF EXISTS `edit_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `edit_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(50) COLLATE latin1_general_ci NOT NULL,
  `can_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=27 DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `edit_permissions`
--

LOCK TABLES `edit_permissions` WRITE;
/*!40000 ALTER TABLE `edit_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `edit_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `issues`
--

DROP TABLE IF EXISTS `issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `issues` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(20) COLLATE latin1_general_ci DEFAULT NULL COMMENT 'bug,feature,comment,todo',
  `tag` varchar(40) COLLATE latin1_general_ci DEFAULT NULL COMMENT 'android,web',
  `content` text COLLATE latin1_general_ci NOT NULL,
  `reply_to_id` int(11) DEFAULT NULL,
  `date_time` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=22 DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issues`
--

LOCK TABLES `issues` WRITE;
/*!40000 ALTER TABLE `issues` DISABLE KEYS */;
INSERT INTO `issues` VALUES (8,'bug-fixed','android','Fragments are messy. When trying to go back to previous Fragments, some foreground Fragments are not cleared and they can overlap each other',NULL,'2013-11-24 18:24:09'),(9,'feature','android','Fixed bug (id=8). Use Activities instead of Fragments to show settings and Cans.',NULL,'2013-11-24 18:25:39'),(10,'feature','web','Added a new bugs &amp; features tracker',NULL,'2013-11-24 18:26:20'),(11,'feature','web','Added a Properties Editor.',NULL,'2013-11-24 18:28:11'),(12,'bug','web','Sometimes Cans are duplicated when trying to upload them to server.',NULL,'2013-11-24 18:28:56'),(13,'feature','android','Finished JSON editor. Allowing viewing JSON as a tree and modifying on device',NULL,'2013-11-25 20:23:26'),(14,'bug-fixed','android','Crashes when no internet connection',NULL,'2013-11-26 01:57:21'),(15,'comment','web,android','Should prohibit the use of too short reset time (or actions like pushing notification could be executed too frequently)',NULL,'2013-11-26 01:59:44'),(16,'feature','android','Added mock data debugging mode',NULL,'2013-12-22 14:38:52'),(17,'feature','android','JSON editing fully functional',NULL,'2013-12-26 01:42:04'),(21,'feature','android','Added bug report',NULL,'2013-12-27 15:11:14');
/*!40000 ALTER TABLE `issues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(40) COLLATE latin1_general_ci NOT NULL,
  `password` varchar(40) COLLATE latin1_general_ci NOT NULL,
  `nickname` varchar(40) COLLATE latin1_general_ci NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=27 DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'cliu.cmu@gmail.com','l','Chen',1),(22,'chenliu@cmu.edu','l','LC',1),(24,'mike@mikeszegedy.com','111111','ziggy101501',1),(25,'jasonh@cs.cmu.edu','passpass44','jas0nh0ng',1),(26,'michael.j.szegedy@gmail.com','111111','mike',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2014-09-20 17:50:35
