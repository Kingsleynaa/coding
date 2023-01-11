    using System.Drawing;
    using System.Globalization;
    using System.IdentityModel.Tokens.Jwt;
    using Microsoft.AspNetCore.Localization;
    using Microsoft.EntityFrameworkCore;
    using PMAS_CITI.Enums;
    using PMAS_CITI.Models;
    using PMAS_CITI.ResponseObjects;
    using Syncfusion.OfficeChart.Implementation;
    using Syncfusion.Presentation;
    using Color = Syncfusion.Drawing.Color;

    namespace PMAS_CITI.Services;

    public class FileService
    {
        private readonly PMASCITIDbContext _context;
        private readonly ProjectService _projectService;
        private readonly MilestoneService _milestoneService;

        public FileService(PMASCITIDbContext context, ProjectService projectService, MilestoneService milestoneService)
        {
            _context = context;
            _projectService = projectService;
            _milestoneService = milestoneService;
        }

        public ProjectDocumentType? GetDocumentTypeById(string documentTypeId)
        {
            return _context.ProjectDocumentTypes
                .SingleOrDefault(x => x.Id == Guid.Parse(documentTypeId));
        }

        public void SaveFileToDirectory(string folderPath, string filePath, IFormFile file)
        {
            // Create directory if it does not exist.
            DirectoryInfo directory = Directory.CreateDirectory(folderPath);

            using FileStream stream = File.Create(filePath);
            file.CopyTo(stream);
            File.SetAttributes(filePath, FileAttributes.Normal);
        }

        public int InsertProjectDocument(ProjectDocument projectDocument)
        {
            _context.ProjectDocuments.Add(projectDocument);
            return _context.SaveChanges();
        }

        public List<ProjectDocument> SearchProjectDocuments(
            string projectId,
            string? documentTypeId = null,
            DocumentSort sort = DocumentSort.DATE_DESC,
            string? query = ""
        )
        {
            if (query == null || query.Trim() == "")
            {
                query = "";
            }

            List<ProjectDocument> searchResults = _context.ProjectDocuments
                .AsNoTracking()
                .Include(x => x.UploadedByUser)
                .Include(x => x.DocumentType)
                .Where(x => x.ProjectId == Guid.Parse(projectId) &&
                            (x.FileName.Contains(query) ||
                             x.UploadedByUser.FullName.Contains(query) ||
                             x.DocumentType.Name.Contains(query))
                )
                .ToList();

            if (documentTypeId != null)
            {
                searchResults = searchResults
                    .Where(x => x.DocumentTypeId == Guid.Parse(documentTypeId))
                    .ToList();
            }

            switch (sort)
            {
                case DocumentSort.DATE_ASC:
                    searchResults = searchResults
                        .OrderBy(x => x.DateUploaded)
                        .ToList();
                    break;
                case DocumentSort.DATE_DESC:
                    searchResults = searchResults
                        .OrderByDescending(x => x.DateUploaded)
                        .ToList();
                    break;
                default:
                    searchResults = searchResults
                        .OrderByDescending(x => x.DateUploaded)
                        .ToList();
                    break;
            }

            return searchResults;
        }   

        public ProjectDocument? GetProjectDocumentById(string id)
        {
            ProjectDocument? currentDocument =
                _context.ProjectDocuments
                    .SingleOrDefault(x => x.Id == Guid.Parse(id));

            return currentDocument;
        }

        public int DeleteDocumentById(string documentId)
        {
            ProjectDocument? document = GetProjectDocumentById(documentId);

            if (document == null)
            {
                return -1;
            }

            _context.ProjectDocuments.Remove(document);
            return _context.SaveChanges();
        }

        public int DeleteDocument(ProjectDocument document)
        {   
            _context.ProjectDocuments.Remove(document);
            return _context.SaveChanges();
        }

        public void DeleteFileFromDirectory(string filePath)
        {
            File.SetAttributes(filePath, FileAttributes.Normal);
            File.Delete(filePath);
        }

        public FileStream ReadFileFromDirectory(string filePath)
        {
            return File.OpenRead(filePath);
        }

        public List<ProjectDocumentType> GetAllDocumentTypes()
        {
            return _context.ProjectDocumentTypes.ToList();
        }

        public void GeneratePowerPointSlides(string filePath, Project targetedProject)
        {
            int fontSizeHeader = 25;
            int fontSizePrimary = 16;
            int fontSizeSecondary = 13;
            string fontFamily = "Fira Sans";

            // Slides Coordinates:
            // left – Represents the left position in points. The Left value ranges from -169056 to 169056.
            // top – Represents the top position in points. The Top value ranges from -169056 to 169056.
            // width – Represents the width in points. The Width value ranges from 0 to 169056.
            // height – Represents the height in points. The Height value ranges from 0 to 169056.

            IPresentation powerpointDoc = Presentation.Create();

            #region ProjectDetailsSlide

            ISlide coverSlide = powerpointDoc.Slides.Add(SlideLayoutType.TitleOnly);

            IShape blackBackground = coverSlide.AddTextBox(0, 490, 960, 50);
            blackBackground.Fill.SolidFill.Color = ColorObject.Black;

            IShape generatedTimestamp = coverSlide.AddTextBox(30, 506, 300, 20);
            IParagraph generatedTimestampValue = generatedTimestamp.TextBody.AddParagraph();
            generatedTimestampValue.Font.FontName = fontFamily;
            generatedTimestampValue.Font.FontSize = 10;
            generatedTimestampValue.Font.Color = ColorObject.White;
            generatedTimestampValue.AddTextPart(
                $"Generated on {DateTime.Now.ToLongDateString()}, {DateTime.Now.ToShortTimeString()}");

            // Project Title
            IShape projectTitle = coverSlide.Shapes[0] as IShape;
            IParagraph projectTitleParagraph = projectTitle.TextBody.AddParagraph();
            projectTitleParagraph.HorizontalAlignment = HorizontalAlignmentType.Center;
            ITextPart projectTitleValue = projectTitleParagraph.AddTextPart(targetedProject.Name);

            projectTitleValue.Font.FontSize = fontSizeHeader;
            projectTitleValue.Font.Bold = true;
            projectTitleValue.Font.FontName = fontFamily;

            // Project Description 
            IShape projectDescriptionShape = coverSlide.AddTextBox(50, 125, 860, 70);
            IParagraph projectDescriptionParagraph = projectDescriptionShape.TextBody.AddParagraph();
            projectDescriptionParagraph.HorizontalAlignment = HorizontalAlignmentType.Center;
            ITextPart projectDescriptionValue = projectDescriptionParagraph.AddTextPart(targetedProject.Description);

            projectDescriptionValue.Font.FontSize = fontSizePrimary;
            projectDescriptionValue.Font.FontName = fontFamily;

            // Project Manager and Lead
            IShape projectHeadsShape = coverSlide.AddTextBox(50, 200, 860, 70);
            User? projectCreator = _context.Users
                .SingleOrDefault(x => x.Id == targetedProject.CreatedyById);

            User? projectLead = _context.ProjectMembers
                .Include(x => x.User)
                .Include(x => x.ProjectRole)
                .FirstOrDefault(x => x.ProjectRole.Name == "Project Lead" &&
                                     x.ProjectId == targetedProject.Id)
                ?.User;

            IParagraph projectHeadsParagraph = projectHeadsShape.TextBody.AddParagraph();
            projectHeadsParagraph.HorizontalAlignment = HorizontalAlignmentType.Center;
            ITextPart projectHeadsValue = projectHeadsParagraph.AddTextPart(
                $@"
    {projectCreator?.FullName} • Creator
    {projectLead?.FullName ?? "Not Assigned"} • Lead
    ");
            projectHeadsValue.Font.FontSize = fontSizePrimary;
            projectHeadsValue.Font.FontName = fontFamily;

            // Projected Dates
            IShape projectProjectedDates = coverSlide.AddTextBox(300, 300, 300, 70);
            IParagraph projectProjectedDatesParagraph = projectProjectedDates.TextBody.AddParagraph();
            ITextPart projectProjectedDatesValue = projectProjectedDatesParagraph.AddTextPart(
                @$"
    Projected Dates: 
    {targetedProject.DateProjectedStart.ToShortDateString()} to {targetedProject.DateProjectedEnd.ToShortDateString()}
    ");
            projectProjectedDatesValue.Font.FontSize = fontSizePrimary;
            projectProjectedDatesValue.Font.FontName = fontFamily;


            IShape projectActualDates = coverSlide.AddTextBox(550, 300, 300, 70);
            IParagraph projectActualDatesParagraph = projectActualDates.TextBody.AddParagraph();
            ITextPart projectActualDatesValue = projectActualDatesParagraph.AddTextPart(
                @$"
    Actual Dates: 
    {targetedProject.DateActualStart?.ToShortDateString() ?? "-"} to {targetedProject.DateActualEnd?.ToShortDateString() ?? "-"}
    ");
            projectActualDatesValue.Font.FontSize = fontSizePrimary;
            projectActualDatesValue.Font.FontName = fontFamily;

            #endregion

            #region ProjectMembersSlide

            List<ProjectMember> members = _context.ProjectMembers
                .Include(x => x.User)
                .Include(x => x.ProjectRole)
                .Where(x => x.ProjectId == targetedProject.Id)
                .OrderByDescending(x => x.ProjectRoleId)
                .ToList();

            // This controls how many members to show per slide
            int numberOfMemberSlides = (int) Math.Ceiling((double) members.Count / 14);
            int memberIndex = 0;

            for (int membersSlideIndex = 0; membersSlideIndex < numberOfMemberSlides; membersSlideIndex++)
            {
                int membersNotDisplayedCount = members.Count - memberIndex + 1;

                ISlide memberSlide = powerpointDoc.Slides.Add(SlideLayoutType.Blank);
                blackBackground = memberSlide.AddTextBox(0, 490, 960, 50);
                blackBackground.Fill.SolidFill.Color = ColorObject.Black;

                generatedTimestamp = memberSlide.AddTextBox(30, 506, 300, 20);
                generatedTimestampValue = generatedTimestamp.TextBody.AddParagraph();
                generatedTimestampValue.Font.FontName = fontFamily;
                generatedTimestampValue.Font.FontSize = 10;
                generatedTimestampValue.Font.Color = ColorObject.White;
                generatedTimestampValue.AddTextPart(
                    $"Generated on {DateTime.Now.ToLongDateString()}, {DateTime.Now.ToShortTimeString()}");

                IShape membersHeader = memberSlide.AddTextBox(50, 30, 900, 70);
                IParagraph membersHeaderParagraph = membersHeader.TextBody.AddParagraph();
                ITextPart membersHeaderValue = membersHeaderParagraph.AddTextPart("Members");

                membersHeaderValue.Font.FontSize = fontSizeHeader;
                membersHeaderValue.Font.Bold = true;
                membersHeaderValue.Font.FontName = fontFamily;

                ITable membersTable;
                if (membersNotDisplayedCount < 15)
                {
                    membersTable = memberSlide.Shapes.AddTable(membersNotDisplayedCount, 3, 50, 90, 860, 50);
                }
                else
                {
                    membersTable = memberSlide.Shapes.AddTable(8, 3, 50, 90, 860, 50);
                }


                int memberRowIndex = 0;

                // Table headers
                IParagraph memberRoleCell = membersTable.Rows[0].Cells[0].TextBody.AddParagraph();
                ITextPart memberRoleText = memberRoleCell.AddTextPart("Role");
                memberRoleText.Font.FontSize = fontSizeSecondary;
                memberRoleText.Font.FontName = fontFamily;

                IParagraph memberNameCell = membersTable.Rows[0].Cells[1].TextBody.AddParagraph();
                ITextPart memberNameText = memberNameCell.AddTextPart("Name");
                memberNameText.Font.FontSize = fontSizeSecondary;
                memberNameText.Font.FontName = fontFamily;

                IParagraph memberEmailCell = membersTable.Rows[0].Cells[2].TextBody.AddParagraph();
                ITextPart memberEmailText = memberEmailCell.AddTextPart("Email");
                memberEmailText.Font.FontSize = fontSizeSecondary;
                memberEmailText.Font.FontName = fontFamily;

                foreach (IRow row in membersTable.Rows)
                {
                    if (memberRowIndex == 0)
                    {
                        memberRowIndex++;
                        continue;
                    }

                    if (memberIndex > members.Count - 1)
                    {
                        break;
                    }

                    IParagraph roleValueCell = row.Cells[0].TextBody.AddParagraph();

                    ITextPart roleValue = roleValueCell.AddTextPart(
                        members[memberIndex].ProjectRole.Name
                    );

                    roleValue.Font.FontSize = fontSizeSecondary;
                    roleValue.Font.FontName = fontFamily;


                    IParagraph nameValueCell = row.Cells[1].TextBody.AddParagraph();
                    ITextPart nameValue = nameValueCell.AddTextPart(
                        members[memberIndex].User.FullName
                    );

                    nameValue.Font.FontSize = fontSizeSecondary;
                    nameValue.Font.FontName = fontFamily;


                    IParagraph emailValueCell = row.Cells[2].TextBody.AddParagraph();
                    ITextPart emailValue = emailValueCell.AddTextPart(
                        members[memberIndex].User.Email
                    );

                    emailValue.Font.FontSize = fontSizeSecondary;
                    emailValue.Font.FontName = fontFamily;

                    memberIndex++;
                    memberRowIndex++;
                }
            }

            #endregion

            #region ProjectRequirementsSlide

            ISlide requirementsSlide = powerpointDoc.Slides.Add(SlideLayoutType.Blank);
            blackBackground = requirementsSlide.AddTextBox(0, 490, 960, 50);
            blackBackground.Fill.SolidFill.Color = ColorObject.Black;

            generatedTimestamp = requirementsSlide.AddTextBox(30, 506, 300, 20);
            generatedTimestampValue = generatedTimestamp.TextBody.AddParagraph();
            generatedTimestampValue.Font.FontName = fontFamily;
            generatedTimestampValue.Font.FontSize = 10;
            generatedTimestampValue.Font.Color = ColorObject.White;
            generatedTimestampValue.AddTextPart(
                $"Generated on {DateTime.Now.ToLongDateString()}, {DateTime.Now.ToShortTimeString()}");


            IShape requirementsHeader = requirementsSlide.AddTextBox(50, 30, 900, 70);
            IParagraph requirementsHeaderParagraph = requirementsHeader.TextBody.AddParagraph();
            ITextPart requirementHeaderValue = requirementsHeaderParagraph.AddTextPart("Requirements");

            requirementHeaderValue.Font.FontSize = fontSizeHeader;
            requirementHeaderValue.Font.Bold = true;
            requirementHeaderValue.Font.FontName = fontFamily;

            // Table content for the requirements
            List<ProjectRequirement> requirements = _context.ProjectRequirements
                .Include(x => x.RequirementType)
                .Where(x => x.ProjectId == targetedProject.Id)
                .OrderByDescending(x => x.RequirementType.Name)
                .ToList();

            ITable requirementsTable = requirementsSlide.Shapes.AddTable(requirements.Count + 1, 3, 50, 90, 860, 20);

            int requirementIndex = 0;
            int requirementRowIndex = 0;

            // Table headers
            IParagraph requirementNameCell = requirementsTable.Rows[0].Cells[0].TextBody.AddParagraph();
            ITextPart requirementNameText = requirementNameCell.AddTextPart("Name");
            requirementNameText.Font.FontSize = fontSizeSecondary;
            requirementNameText.Font.FontName = fontFamily;
            requirementsTable.Rows[0].Cells[0].ColumnWidth = 200;

            IParagraph requirementTypeCell = requirementsTable.Rows[0].Cells[1].TextBody.AddParagraph();
            ITextPart requirementTypeText = requirementTypeCell.AddTextPart("Type");
            requirementTypeText.Font.FontSize = fontSizeSecondary;
            requirementTypeText.Font.FontName = fontFamily;
            requirementsTable.Rows[0].Cells[1].ColumnWidth = 100;

            IParagraph requirementDescCell = requirementsTable.Rows[0].Cells[2].TextBody.AddParagraph();
            ITextPart requirementDescText = requirementDescCell.AddTextPart("Description");
            requirementDescText.Font.FontSize = fontSizeSecondary;
            requirementDescText.Font.FontName = fontFamily;
            requirementsTable.Rows[0].Cells[2].ColumnWidth = 560;
            foreach (IRow row in requirementsTable.Rows)
            {
                if (requirementRowIndex == 0)
                {
                    requirementRowIndex++;
                    continue;
                }

                IParagraph nameValueCell = row.Cells[0].TextBody.AddParagraph();
                ITextPart nameValue = nameValueCell.AddTextPart(
                    requirements[requirementIndex].Name
                );

                nameValue.Font.FontSize = fontSizeSecondary;
                nameValue.Font.FontName = fontFamily;

                IParagraph typeValueCell = row.Cells[1].TextBody.AddParagraph();
                ITextPart typeValue = typeValueCell.AddTextPart(
                    requirements[requirementIndex].RequirementType.Name
                );

                typeValue.Font.FontSize = fontSizeSecondary;
                typeValue.Font.FontName = fontFamily;

                IParagraph descValueCell = row.Cells[2].TextBody.AddParagraph();
                ITextPart descValue = descValueCell.AddTextPart(
                    requirements[requirementIndex].Description
                );

                descValue.Font.FontSize = fontSizeSecondary;
                descValue.Font.FontName = fontFamily;

                requirementRowIndex++;
                requirementIndex++;
            }

            #endregion

            #region ProjectOverviewSlide

            ISlide overviewSlide = powerpointDoc.Slides.Add(SlideLayoutType.Blank);

            blackBackground = overviewSlide.AddTextBox(0, 490, 960, 50);
            blackBackground.Fill.SolidFill.Color = ColorObject.Black;

            generatedTimestamp = overviewSlide.AddTextBox(30, 506, 300, 20);
            generatedTimestampValue = generatedTimestamp.TextBody.AddParagraph();
            generatedTimestampValue.Font.FontName = fontFamily;
            generatedTimestampValue.Font.FontSize = 10;
            generatedTimestampValue.Font.Color = ColorObject.White;
            generatedTimestampValue.AddTextPart(
                $"Generated on {DateTime.Now.ToLongDateString()}, {DateTime.Now.ToShortTimeString()}");

            IShape overviewHeader = overviewSlide.AddTextBox(50, 30, 900, 70);
            IParagraph overviewHeaderParagraph = overviewHeader.TextBody.AddParagraph();
            ITextPart overviewHeaderValue = overviewHeaderParagraph.AddTextPart("Project Value");

            overviewHeaderValue.Font.FontSize = fontSizeHeader;
            overviewHeaderValue.Font.Bold = true;
            overviewHeaderValue.Font.FontName = fontFamily;

            PaymentInformation paymentInformation = _projectService.GetPaymentInformation(targetedProject);

            IShape projectTotal = overviewSlide.AddTextBox(50, 170, 300, 70);
            IParagraph projectTotalParagraph = projectTotal.TextBody.AddParagraph();
            projectTotalParagraph.AddTextPart(
                $@"
    Total Payable:
    {paymentInformation.Total:C}
    ");
            projectTotalParagraph.Font.FontName = fontFamily;
            projectTotalParagraph.Font.FontSize = fontSizeSecondary;


            IShape projectPaid = overviewSlide.AddTextBox(50, 220, 300, 70);
            IParagraph projectPaidParagraph = projectPaid.TextBody.AddParagraph();
            projectPaidParagraph.AddTextPart(
                $@"
    Paid:
    {paymentInformation.Paid:C}
    ");
            projectPaidParagraph.Font.FontSize = fontSizeSecondary;
            projectPaidParagraph.Font.FontName = fontFamily;


            IShape projectOutstanding = overviewSlide.AddTextBox(50, 270, 300, 70);
            IParagraph projectOutstandingParagraph = projectOutstanding.TextBody.AddParagraph();
            projectOutstandingParagraph.AddTextPart($@"
    Outstanding:
    {paymentInformation.Outstanding:C}
    ");
            projectOutstandingParagraph.Font.FontSize = fontSizeSecondary;
            projectOutstandingParagraph.Font.FontName = fontFamily;

            List<ProjectMilestone> milestones = _context.ProjectMilestones
                .Where(x => x.ProjectId == targetedProject.Id)
                .OrderByDescending(x => x.DateProjectedStart)
                .ToList();

            ITable milestonesTable = overviewSlide.Shapes.AddTable(2, 7, 50, 90, 860, 50);

            IParagraph milestoneCountCell = milestonesTable.Rows[0].Cells[0].TextBody.AddParagraph();
            ITextPart milestoneCountText = milestoneCountCell.AddTextPart("Total Milestones");
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[0].Cells[1].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart("Not Started");
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[0].Cells[2].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart("Ongoing");
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[0].Cells[3].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart("Awaiting Payment");
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[0].Cells[4].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart("Paid");
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[0].Cells[5].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart("Completion Overdue");
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[0].Cells[6].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart("Payment Overdue");
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[1].Cells[0].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart(milestones.Count().ToString());
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[1].Cells[1].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart(milestones
                .Count(x => _milestoneService.GetMilestoneStatus(x) == MilestoneStatus.NOT_STARTED).ToString());
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[1].Cells[2].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart(milestones
                .Count(x => _milestoneService.GetMilestoneStatus(x) == MilestoneStatus.ONGOING).ToString());
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[1].Cells[3].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart(milestones
                .Count(x => _milestoneService.GetMilestoneStatus(x) == MilestoneStatus.AWAITING_PAYMENT).ToString());
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[1].Cells[4].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart(milestones
                .Count(x => _milestoneService.GetMilestoneStatus(x) == MilestoneStatus.PAID).ToString());
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[1].Cells[5].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart(milestones
                .Count(x => _milestoneService.GetMilestoneStatus(x) == MilestoneStatus.OVERDUE_COMPLETION).ToString());
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            milestoneCountCell = milestonesTable.Rows[1].Cells[6].TextBody.AddParagraph();
            milestoneCountText = milestoneCountCell.AddTextPart(milestones
                .Count(x => _milestoneService.GetMilestoneStatus(x) == MilestoneStatus.OVERDUE_PAYMENT).ToString());
            milestoneCountText.Font.FontSize = fontSizeSecondary;
            milestoneCountText.Font.FontName = fontFamily;

            #endregion
            #region ProjectMilestonesSlide

            ISlide milestoneSlide = powerpointDoc.Slides.Add(SlideLayoutType.Blank);
            blackBackground = milestoneSlide.AddTextBox(0, 490, 960, 50);
            blackBackground.Fill.SolidFill.Color = ColorObject.Black;

            generatedTimestamp = milestoneSlide.AddTextBox(30, 506, 300, 20);
            generatedTimestampValue = generatedTimestamp.TextBody.AddParagraph();
            generatedTimestampValue.Font.FontName = fontFamily;
            generatedTimestampValue.Font.FontSize = 10;
            generatedTimestampValue.Font.Color = ColorObject.White;
            generatedTimestampValue.AddTextPart(
                $"Generated on {DateTime.Now.ToLongDateString()}, {DateTime.Now.ToShortTimeString()}");


            IShape milestoneHeader = milestoneSlide.AddTextBox(50, 30, 900, 70);
            IParagraph milestonesHeaderParagraph = milestoneHeader.TextBody.AddParagraph();
            ITextPart milestoneHeaderValue = milestonesHeaderParagraph.AddTextPart("All Milestones");

            milestoneHeaderValue.Font.Bold = true;
            milestoneHeaderValue.Font.FontSize = fontSizeHeader;
            milestoneHeaderValue.Font.FontName = fontFamily;

            // Table content for milestones

            milestones = _context.ProjectMilestones
                .Where(x => x.ProjectId == targetedProject.Id)
                .OrderByDescending(x => x.DateProjectedStart)
                .ToList();

            milestonesTable = milestoneSlide.Shapes.AddTable(milestones.Count + 1, 6, 50, 90, 800, 100);

            int milestoneIndex = 0;
            int rowIndex = 0;

            IParagraph statusCell = milestonesTable.Rows[0].Cells[0].TextBody.AddParagraph();
            ITextPart statusText = statusCell.AddTextPart("Status");
            statusText.Font.FontSize = fontSizeSecondary;
            statusText.Font.FontName = fontFamily;

            milestonesTable.Rows[0].Cells[0].ColumnWidth = 200;

            IParagraph nameCell = milestonesTable.Rows[0].Cells[1].TextBody.AddParagraph();
            ITextPart nameText = nameCell.AddTextPart("Name");
            nameText.Font.FontSize = fontSizeSecondary;
            nameText.Font.FontName = fontFamily;

            IParagraph projectedtDatesCell = milestonesTable.Rows[0].Cells[2].TextBody.AddParagraph();
            ITextPart projectedDatesText = projectedtDatesCell.AddTextPart("Projected Dates");
            projectedDatesText.Font.FontSize = fontSizeSecondary;
            projectedDatesText.Font.FontName = fontFamily;

            IParagraph actualDatesCell = milestonesTable.Rows[0].Cells[3].TextBody.AddParagraph();
            ITextPart actualDatesText = actualDatesCell.AddTextPart("Actual Dates");
            actualDatesText.Font.FontSize = fontSizeSecondary;
            actualDatesText.Font.FontName = fontFamily;

            IParagraph paidDateCell = milestonesTable.Rows[0].Cells[4].TextBody.AddParagraph();
            ITextPart paidDateText = paidDateCell.AddTextPart("Paid Date");
            paidDateText.Font.FontSize = fontSizeSecondary;
            paidDateText.Font.FontName = fontFamily;

            IParagraph isPaidCell = milestonesTable.Rows[0].Cells[5].TextBody.AddParagraph();
            ITextPart isPaidText = isPaidCell.AddTextPart("Is Paid");
            isPaidText.Font.FontSize = fontSizeSecondary;
            isPaidText.Font.FontName = fontFamily;


            foreach (IRow row in milestonesTable.Rows)
            {
                if (rowIndex == 0)
                {
                    rowIndex++;
                    continue;
                }

                if (_milestoneService.GetMilestoneStatus(milestones[milestoneIndex]) == MilestoneStatus.OVERDUE_PAYMENT ||
                    _milestoneService.GetMilestoneStatus(milestones[milestoneIndex]) == MilestoneStatus.OVERDUE_COMPLETION)
                {
                    foreach (ICell cell in row.Cells)
                    {
                        cell.Fill.SolidFill.Color = ColorObject.Pink;
                        cell.Fill.SolidFill.Transparency = 80;
                    }
                }

                IParagraph statusValueCell = row.Cells[0].TextBody.AddParagraph();
                ITextPart statusValue = statusValueCell.AddTextPart(CultureInfo
                    .CurrentCulture
                    .TextInfo
                    .ToTitleCase(String
                        .Join(" ", _milestoneService
                            .GetMilestoneStatus(milestones[milestoneIndex])
                            .ToString()
                            ?.ToLower()
                            ?.Split("_") ?? Array.Empty<string>())
                    ));

                statusValue.Font.FontSize = fontSizeSecondary;
                statusValue.Font.FontName = fontFamily;

                IParagraph nameValueCell = row.Cells[1].TextBody.AddParagraph();
                ITextPart nameValue = nameValueCell.AddTextPart(
                    milestones[milestoneIndex].Name
                );
                nameValue.Font.FontSize = fontSizeSecondary;
                nameValue.Font.FontName = fontFamily;

                IParagraph projectedDatesValueCell = row.Cells[2].TextBody.AddParagraph();
                ITextPart projectedDatesValue = projectedDatesValueCell.AddTextPart(
                    $"{milestones[milestoneIndex].DateProjectedStart.ToShortDateString()} to {milestones[milestoneIndex].DateProjectedEnd.ToShortDateString()}"
                );
                projectedDatesValue.Font.FontSize = fontSizeSecondary;
                projectedDatesValue.Font.FontName = fontFamily;

                IParagraph actualDatesValueCell = row.Cells[3].TextBody.AddParagraph();
                ITextPart actualDatesValue = actualDatesValueCell.AddTextPart(
                    $"{milestones[milestoneIndex].DateActualStart?.ToShortDateString() ?? "-"} to {milestones[milestoneIndex].DateActualEnd?.ToShortDateString() ?? "-"}"
                );
                actualDatesValue.Font.FontSize = fontSizeSecondary;
                actualDatesValue.Font.FontName = fontFamily;

                IParagraph datePaidValueCell = row.Cells[4].TextBody.AddParagraph();
                ITextPart datePaidValue = datePaidValueCell.AddTextPart(
                    milestones[milestoneIndex].DatePaid?.ToShortDateString() ?? "-"
                );
                datePaidValue.Font.FontSize = fontSizeSecondary;
                datePaidValue.Font.FontName = fontFamily;

                IParagraph isPaidValueCell = row.Cells[5].TextBody.AddParagraph();
                ITextPart isPaidValue = isPaidValueCell.AddTextPart(
                    milestones[milestoneIndex].IsPaid.ToString()
                );
                isPaidValue.Font.FontSize = fontSizeSecondary;
                isPaidValue.Font.FontName = fontFamily;

                rowIndex++;
                milestoneIndex++;
            }

            #endregion

            // This section would cover milestones that either have payment or completion overdue

            #region LateMilestones

            List<ProjectMilestone> lateMilestones = _context.ProjectMilestones
                .Include(x => x.ProjectTasks)
                .ToList()
                .Where(x => _milestoneService.GetMilestoneStatus(x) == MilestoneStatus.OVERDUE_PAYMENT ||
                            _milestoneService.GetMilestoneStatus(x) == MilestoneStatus.OVERDUE_COMPLETION)
                .ToList();

            milestoneSlide = powerpointDoc.Slides.Add(SlideLayoutType.Blank);
            blackBackground = milestoneSlide.AddTextBox(0, 490, 960, 50);
            blackBackground.Fill.SolidFill.Color = ColorObject.Black;

            generatedTimestamp = milestoneSlide.AddTextBox(30, 506, 300, 20);
            generatedTimestampValue = generatedTimestamp.TextBody.AddParagraph();
            generatedTimestampValue.Font.FontName = fontFamily;
            generatedTimestampValue.Font.FontSize = 10;
            generatedTimestampValue.Font.Color = ColorObject.White;
            generatedTimestampValue.AddTextPart(
                $"Generated on {DateTime.Now.ToLongDateString()}, {DateTime.Now.ToShortTimeString()}");

            milestoneHeader = milestoneSlide.AddTextBox(50, 30, 900, 70);
            milestonesHeaderParagraph = milestoneHeader.TextBody.AddParagraph();
            milestoneHeaderValue = milestonesHeaderParagraph.AddTextPart("Late Milestones • Completion or Payment Overdue");

            milestoneHeaderValue.Font.Bold = true;
            milestoneHeaderValue.Font.FontSize = fontSizeHeader;
            milestoneHeaderValue.Font.FontName = fontFamily;

            // Table content for milestones
            milestonesTable = milestoneSlide.Shapes.AddTable(lateMilestones.Count + 1, 6, 50, 90, 800, 50);

            milestoneIndex = 0;
            rowIndex = 0;

            statusCell = milestonesTable.Rows[0].Cells[0].TextBody.AddParagraph();
            statusText = statusCell.AddTextPart("Status");
            statusText.Font.FontSize = fontSizeSecondary;
            statusText.Font.FontName = fontFamily;

            milestonesTable.Rows[0].Cells[0].ColumnWidth = 200;

            nameCell = milestonesTable.Rows[0].Cells[1].TextBody.AddParagraph();
            nameText = nameCell.AddTextPart("Name");
            nameText.Font.FontSize = fontSizeSecondary;
            nameText.Font.FontName = fontFamily;

            projectedtDatesCell = milestonesTable.Rows[0].Cells[2].TextBody.AddParagraph();
            projectedDatesText = projectedtDatesCell.AddTextPart("Projected Dates");
            projectedDatesText.Font.FontSize = fontSizeSecondary;
            projectedDatesText.Font.FontName = fontFamily;

            actualDatesCell = milestonesTable.Rows[0].Cells[3].TextBody.AddParagraph();
            actualDatesText = actualDatesCell.AddTextPart("Actual Dates");
            actualDatesText.Font.FontSize = fontSizeSecondary;
            actualDatesText.Font.FontName = fontFamily;

            paidDateCell = milestonesTable.Rows[0].Cells[4].TextBody.AddParagraph();
            paidDateText = paidDateCell.AddTextPart("Completed Tasks");
            paidDateText.Font.FontSize = fontSizeSecondary;
            paidDateText.Font.FontName = fontFamily;
            milestonesTable.Rows[0].Cells[4].Fill.SolidFill.Color = ColorObject.Green;
            milestonesTable.Rows[0].Cells[4].Fill.SolidFill.Transparency = 60;

            isPaidCell = milestonesTable.Rows[0].Cells[5].TextBody.AddParagraph();
            isPaidText = isPaidCell.AddTextPart("Incomplete Tasks");
            isPaidText.Font.FontSize = fontSizeSecondary;
            isPaidText.Font.FontName = fontFamily;
            isPaidCell.Font.Color = ColorObject.Black;
            milestonesTable.Rows[0].Cells[5].Fill.SolidFill.Color = ColorObject.Pink;
            milestonesTable.Rows[0].Cells[5].Fill.SolidFill.Transparency = 60;


            foreach (IRow row in milestonesTable.Rows)
            {
                if (rowIndex == 0)
                {
                    rowIndex++;
                    continue;
                }

                IParagraph statusValueCell = row.Cells[0].TextBody.AddParagraph();
                ITextPart statusValue = statusValueCell.AddTextPart(CultureInfo
                    .CurrentCulture
                    .TextInfo
                    .ToTitleCase(String
                        .Join(" ", _milestoneService
                            .GetMilestoneStatus(lateMilestones[milestoneIndex])
                            .ToString()
                            ?.ToLower()
                            ?.Split("_") ?? Array.Empty<string>())
                    ));

                statusValue.Font.FontSize = fontSizeSecondary;
                statusValue.Font.FontName = fontFamily;

                IParagraph nameValueCell = row.Cells[1].TextBody.AddParagraph();
                ITextPart nameValue = nameValueCell.AddTextPart(
                    lateMilestones[milestoneIndex].Name
                );
                nameValue.Font.FontSize = fontSizeSecondary;
                nameValue.Font.FontName = fontFamily;

                IParagraph projectedDatesValueCell = row.Cells[2].TextBody.AddParagraph();
                ITextPart projectedDatesValue = projectedDatesValueCell.AddTextPart(
                    $"{lateMilestones[milestoneIndex].DateProjectedStart.ToShortDateString()} to {lateMilestones[milestoneIndex].DateProjectedEnd.ToShortDateString()}"
                );
                projectedDatesValue.Font.FontSize = fontSizeSecondary;
                projectedDatesValue.Font.FontName = fontFamily;

                IParagraph actualDatesValueCell = row.Cells[3].TextBody.AddParagraph();
                ITextPart actualDatesValue = actualDatesValueCell.AddTextPart(
                    $"{lateMilestones[milestoneIndex].DateActualStart?.ToShortDateString() ?? "-"} to {lateMilestones[milestoneIndex].DateActualEnd?.ToShortDateString() ?? "-"}"
                );
                actualDatesValue.Font.FontSize = fontSizeSecondary;
                actualDatesValue.Font.FontName = fontFamily;

                string completedTasks = "";
                string incompletedTasks = "";

                foreach (ProjectTask task in lateMilestones[milestoneIndex].ProjectTasks)
                {
                    if (task.IsCompleted)
                    {
                        completedTasks += $@"• {task.Name}
    ";
                    }
                    else
                    {
                        incompletedTasks += $@"• {task.Name}
    ";
                    }
                }

                IParagraph datePaidValueCell = row.Cells[4].TextBody.AddParagraph();
                ITextPart datePaidValue = datePaidValueCell.AddTextPart(
                    completedTasks
                );
                datePaidValue.Font.FontSize = fontSizeSecondary;
                datePaidValue.Font.FontName = fontFamily;
                row.Cells[4].Fill.SolidFill.Color = ColorObject.Green;
                row.Cells[4].Fill.SolidFill.Transparency = 80;

                IParagraph isPaidValueCell = row.Cells[5].TextBody.AddParagraph();
                ITextPart isPaidValue = isPaidValueCell.AddTextPart(
                    incompletedTasks
                );
                isPaidValue.Font.FontSize = fontSizeSecondary;
                isPaidValue.Font.FontName = fontFamily;
                row.Cells[5].Fill.SolidFill.Color = ColorObject.Pink;
                row.Cells[5].Fill.SolidFill.Transparency = 80;

                rowIndex++;
                milestoneIndex++;
            }

            #endregion

            #region ProjectRisks

            List<ProjectRisk> risks = _context.ProjectRisks
                .Include(x => x.RiskLikelihood)
                .Include(x => x.RiskSeverity)
                .Include(x => x.RiskCategory)
                .Where(x => x.ProjectId == targetedProject.Id)
                .OrderByDescending(x => x.RiskSeverity.Id)
                .ThenByDescending(x => x.RiskLikelihood.Id)
                .ToList();

            int numberOfRiskSlides = (int) Math.Ceiling((double) risks.Count / 2);

            int riskIndex = 0;
            for (int riskSlideIndex = 0;
                 riskSlideIndex < numberOfRiskSlides;
                 riskSlideIndex++)
            {
                ISlide risksSlide = powerpointDoc.Slides.Add(SlideLayoutType.Blank);
                blackBackground = risksSlide.AddTextBox(0, 490, 960, 50);
                blackBackground.Fill.SolidFill.Color = ColorObject.Black;

                generatedTimestamp = risksSlide.AddTextBox(30, 506, 300, 20);
                generatedTimestampValue = generatedTimestamp.TextBody.AddParagraph();
                generatedTimestampValue.Font.FontName = fontFamily;
                generatedTimestampValue.Font.FontSize = 10;
                generatedTimestampValue.Font.Color = ColorObject.White;
                generatedTimestampValue.AddTextPart(
                    $"Generated on {DateTime.Now.ToLongDateString()}, {DateTime.Now.ToShortTimeString()}");


                IShape risksHeader = risksSlide.AddTextBox(50, 30, 900, 70);
                IParagraph risksHeaderParagraph = risksHeader.TextBody.AddParagraph();
                ITextPart risksHeaderValue = risksHeaderParagraph.AddTextPart("Risks");

                risksHeaderValue.Font.FontSize = fontSizeHeader;
                risksHeaderValue.Font.Bold = true;
                risksHeaderValue.Font.FontName = fontFamily;


                ITable risksTable = risksSlide.Shapes.AddTable(3, 5, 50, 90, 860, 100);

                int riskRowIndex = 0;

                // Table headers
                IParagraph riskTypeCell = risksTable.Rows[0].Cells[0].TextBody.AddParagraph();
                ITextPart riskTypeText = riskTypeCell.AddTextPart("Category");
                riskTypeText.Font.FontSize = fontSizeSecondary;
                riskTypeText.Font.FontName = fontFamily;
                risksTable.Rows[0].Cells[0].ColumnWidth = 200;

                IParagraph riskDescCell = risksTable.Rows[0].Cells[1].TextBody.AddParagraph();
                ITextPart riskDescText = riskDescCell.AddTextPart("Description");
                riskDescText.Font.FontSize = fontSizeSecondary;
                riskDescText.Font.FontName = fontFamily;
                risksTable.Rows[0].Cells[1].ColumnWidth = 200;

                IParagraph riskSeverityCell = risksTable.Rows[0].Cells[2].TextBody.AddParagraph();
                ITextPart riskSeverityText = riskSeverityCell.AddTextPart("Severity");
                riskSeverityText.Font.FontSize = fontSizeSecondary;
                riskSeverityText.Font.FontName = fontFamily;
                risksTable.Rows[0].Cells[2].ColumnWidth = 100;

                IParagraph riskLikelihoodCell = risksTable.Rows[0].Cells[3].TextBody.AddParagraph();
                ITextPart riskLikelihoodText = riskLikelihoodCell.AddTextPart("Likelihood");
                riskLikelihoodText.Font.FontSize = fontSizeSecondary;
                riskLikelihoodText.Font.FontName = fontFamily;
                risksTable.Rows[0].Cells[3].ColumnWidth = 100;

                IParagraph riskMitigationCell = risksTable.Rows[0].Cells[4].TextBody.AddParagraph();
                ITextPart riskMitigationText = riskMitigationCell.AddTextPart("Mitigation");
                riskMitigationText.Font.FontSize = fontSizeSecondary;
                riskMitigationText.Font.FontName = fontFamily;
                risksTable.Rows[0].Cells[4].ColumnWidth = 260;


                foreach (IRow row in risksTable.Rows)
                {
                    if (riskRowIndex == 0)
                    {
                        riskRowIndex++;
                        continue;
                    }

                    if (riskIndex > risks.Count - 1)
                    {
                        break;
                    }

                    IParagraph nameValueCell = row.Cells[0].TextBody.AddParagraph();

                    ITextPart nameValue = nameValueCell.AddTextPart(
                        risks[riskIndex].RiskCategory.Name
                    );

                    nameValueCell.AddTextPart(@"
    ");

                    ITextPart definitionValue = nameValueCell.AddTextPart(
                        risks[riskIndex].RiskCategory.Definition
                    );

                    nameValue.Font.FontSize = fontSizeSecondary;
                    nameValue.Font.Bold = true;
                    nameValue.Font.FontName = fontFamily;

                    definitionValue.Font.FontSize = fontSizeSecondary;
                    definitionValue.Font.FontName = fontFamily;


                    IParagraph descValueCell = row.Cells[1].TextBody.AddParagraph();
                    ITextPart descValue = descValueCell.AddTextPart(
                        risks[riskIndex].Description
                    );

                    descValue.Font.FontSize = fontSizeSecondary;
                    descValue.Font.FontName = fontFamily;

                    IParagraph likelihoodValueCell = row.Cells[2].TextBody.AddParagraph();
                    ITextPart likelihoodValue = likelihoodValueCell.AddTextPart(
                        risks[riskIndex].RiskLikelihood.Name
                    );

                    likelihoodValue.Font.FontSize = fontSizeSecondary;
                    likelihoodValue.Font.FontName = fontFamily;

                    IParagraph severityValueCell = row.Cells[3].TextBody.AddParagraph();
                    ITextPart severityValue = severityValueCell.AddTextPart(
                        risks[riskIndex].RiskSeverity.Name
                    );

                    severityValue.Font.FontSize = fontSizeSecondary;
                    severityValue.Font.FontName = fontFamily;

                    IParagraph mitigationValueCell = row.Cells[4].TextBody.AddParagraph();
                    ITextPart mitigationValue = mitigationValueCell.AddTextPart(
                        risks[riskIndex].Mitigation
                    );

                    mitigationValue.Font.FontSize = fontSizeSecondary;
                    mitigationValue.Font.FontName = fontFamily;

                    riskRowIndex++;
                    riskIndex++;
                }
            }

            #endregion

            #region EndSlide

            coverSlide = powerpointDoc.Slides.Add(SlideLayoutType.TitleOnly);

            blackBackground = coverSlide.AddTextBox(0, 490, 960, 50);
            blackBackground.Fill.SolidFill.Color = ColorObject.Black;

            generatedTimestamp = coverSlide.AddTextBox(30, 506, 300, 20);
            generatedTimestampValue = generatedTimestamp.TextBody.AddParagraph();
            generatedTimestampValue.Font.FontName = fontFamily;
            generatedTimestampValue.Font.FontSize = 10;
            generatedTimestampValue.Font.Color = ColorObject.White;
            generatedTimestampValue.AddTextPart(
                $"Generated on {DateTime.Now.ToLongDateString()}, {DateTime.Now.ToShortTimeString()}");

            // Closing slides
            projectTitle = coverSlide.Shapes[0] as IShape;
            projectTitleParagraph = projectTitle.TextBody.AddParagraph();
            projectTitleParagraph.HorizontalAlignment = HorizontalAlignmentType.Center;
            projectTitleValue = projectTitleParagraph.AddTextPart("Any questions?");

            projectTitleValue.Font.FontSize = fontSizeHeader;
            projectTitleValue.Font.Bold = true;
            projectTitleValue.Font.FontName = fontFamily;

            #endregion

            // Stores the file into a temporary directory 
            FileStream outputStream = new FileStream(filePath, FileMode.Create);

            powerpointDoc.Save(outputStream);
            outputStream.Dispose();
        }
    }