import { UserDocument, IStudent, IStudentRep, IOrganizer, IAdmin } from '../models/user';

export function isStudent(user: UserDocument): user is UserDocument & IStudent {
  return user.role === 'student';
}

export function isStudentRep(user: UserDocument): user is UserDocument & IStudentRep {
  return user.role === 'student_rep';
}

export function isOrganizer(user: UserDocument): user is UserDocument & IOrganizer {
  return user.role === 'organizer';
}

export function isAdmin(user: UserDocument): user is UserDocument & IAdmin {
  return user.role === 'admin';
}
